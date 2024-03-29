const { ObjectId } = require('mongodb')

class OrganizationDbController {
  constructor ({ db }) {
    this.db = db
  }

  async searchByNameAndHost ({ name, host }) {
    // only allow alphanumeric characters and hyphens
    // which is also what GitHub constrains the org name to
    // (and probably future hosts); the input should already
    // be safe due to a similar cleansing on the API schema level;
    // adding this as an extra precaution
    const safeName = name.replace(/[^a-z0-9-]/gi, '')
    if (!safeName) return [] // handle case where all the characters were dangerous

    const partialNameMatch = new RegExp(`.*${safeName}.*`, 'i')
    const organizations = await this.db.collection('organizations').find({
      name: partialNameMatch,
      host
      // TODO there may be cases where organizations do not want to appear
      // in search results; if so, we can add a flag to their profiles in
      // the DB and filter it out here
    }, {
      limit: 10,
      projection: {
        _id: 1,
        name: 1,
        globalDonation: 1,
        donationAmount: 1,
        avatarUrl: 1
      }
    }).toArray()

    return organizations.map(({ _id, ...rest }) => ({ id: _id, ...rest }))
  }

  async get ({ orgId }) {
    const org = await this.db.collection('organizations').findOne({ _id: ObjectId(orgId) })

    if (!org) return org

    const { _id: id, ...rest } = org
    return { id, ...rest }
  }

  async getIdByCustomerId ({ customerId }) {
    const org = await this.db.collection('organizations').findOne({
      'billingInfo.customerId': customerId
    })
    if (!org) return org
    const { name, _id: id } = org

    return { name, id }
  }

  async getByInstallationId ({ installationId }) {
    const org = await this.db.collection('organizations').findOne({
      installationId
    })

    if (!org) return org

    const { _id: id, ...rest } = org
    return { id, ...rest }
  }

  async create ({ name, host, installationId, email, avatarUrl }) {
    const orgToInsert = {
      name,
      host,
      installationId,
      email,
      avatarUrl,
      globalDonation: false,
      billingInfo: {},
      donationAmount: 0,
      donationChanges: []
    }
    const { insertedId } = await this.db.collection('organizations').insertOne(orgToInsert)
    return { id: insertedId, ...orgToInsert }
  }

  async updateCustomerId ({ orgId, customerId }) {
    return this.db.collection('organizations').updateOne({
      _id: ObjectId(orgId)
    }, {
      $set: { 'billingInfo.customerId': customerId }
    })
  }

  async updateEmail ({ orgId, email }) {
    return this.db.collection('organizations').updateOne({
      _id: ObjectId(orgId)
    }, {
      $set: { email }
    })
  }

  async updatePublicallyGive ({ orgId, publicallyGive }) {
    return this.db.collection('organizations').updateOne({
      _id: ObjectId(orgId)
    }, {
      $set: { publicallyGive }
    })
  }

  async updateDescription ({ orgId, description }) {
    return this.db.collection('organizations').updateOne({
      _id: ObjectId(orgId)
    }, {
      $set: { description }
    })
  }

  async addSnapshot ({ orgId, totalDeps, topLevelDeps }) {
    return this.db.collection('organizations').updateOne({
      _id: ObjectId(orgId)
    }, {
      $push: {
        snapshots: {
          timestamp: Date.now(),
          totalDependencies: totalDeps,
          topLevelDependencies: topLevelDeps
        }
      }
    })
  }

  async setDonation ({ orgId, amount, globalDonation, publicallyGive }) {
    // Amount in this case is passed in as cents so need to convert to mc
    const donationInMc = amount * 1000
    return this.db.collection('organizations').updateOne({
      _id: ObjectId(orgId)
    }, {
      $set: {
        monthlyDonation: donationInMc !== 0,
        donationAmount: donationInMc,
        ...(typeof globalDonation !== 'undefined' && { globalDonation }),
        ...(typeof publicallyGive !== 'undefined' && { publicallyGive })
      },
      $push: {
        donationChanges: {
          timestamp: Date.now(),
          donationAmount: donationInMc,
          globalDonation
        }
      }
    })
  }

  async getDonationLedger ({ orgId, limit, offset }) {
    const aggregationFunction = [
      {
        $match: {
          'donationRevenue.organizationId': {
            $eq: orgId
          }
        }
      }, {
        $project: {
          _id: 1,
          name: 1,
          maintainers: 1,
          registry: 1,
          donationRevenue: {
            $filter: {
              input: '$donationRevenue',
              as: 'donRev',
              cond: {
                $eq: [
                  '$$donRev.organizationId', orgId
                ]
              }
            }
          }
        }
      }, {
        $project: {
          _id: 1,
          name: 1,
          maintainers: 1,
          registry: 1,
          totalPaid: {
            $sum: '$donationRevenue.amount'
          }
        }
      }, {
        $sort: {
          totalPaid: -1
        }
      }
    ]
    let cursor = this.db.collection('packages').aggregate(aggregationFunction)

    if (offset) {
      cursor = cursor.skip(offset)
    }
    if (limit) {
      cursor = cursor.limit(limit)
    }
    const pkgs = await cursor.toArray()

    return pkgs.map((v) => {
      const { _id, ...rest } = v
      return { id: _id.toString(), ...rest }
    })
  }

  async getDonationLedgerSize ({ orgId }) {
    return this.db.collection('packages').find({
      'donationRevenue.organizationId': orgId
    }).count()
  }
}

module.exports = OrganizationDbController
