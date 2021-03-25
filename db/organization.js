const { ObjectId } = require('mongodb')

class OrganizationDbController {
  constructor ({ db }) {
    this.db = db
  }

  async findOrgsByNameAndHost ({ names, host }) {
    const orgs = await this.db.collection('organizations').find({
      name: { $in: names },
      host
    }).toArray()

    return orgs.map((org) => ({ id: org._id, ...org }))
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
    return org && org._id
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

  async getDonationLedger ({ orgId }) {
    const pkgs = await this.db.collection('packages').aggregate([
      {
        $match: { // First filter out all packages that dont have a single donation from this org
          'donationRevenue.organizationId': {
            $eq: orgId
          }
        }
      }, {
        $unwind: { // unwind donations
          path: '$donationRevenue',
          preserveNullAndEmptyArrays: false
        }
      }, {
        $match: { // filter out all donations not made by this org
          'donationRevenue.organizationId': {
            $eq: orgId
          }
        }
      }, {
        $group: { // sum up total paid and retain fields of name, registry, maintainers
          _id: '$_id',
          totalPaid: {
            $sum: '$donationRevenue.amount'
          },
          name: {
            $first: '$name'
          },
          registry: {
            $first: '$registry'
          },
          maintainers: {
            $first: '$maintainers'
          }
        }
      }
    ]).toArray()
    return pkgs.map((v) => {
      const { _id, ...rest } = v
      return { id: _id.toString(), ...rest }
    })
  }
}

module.exports = OrganizationDbController
