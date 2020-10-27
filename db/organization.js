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

  async getByNameAndHost ({ name, host }) {
    const org = await this.db.collection('organizations').findOne({ name, host })

    if (!org) return org

    const { _id: id, ...rest } = org
    return { id, ...rest }
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
      donationAmountChanges: []
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

  async setDonation ({ orgId, amount, globalDonation = false }) {
    // Amount in this case is passed in as cents so need to convert to mc
    const donationInMc = amount * 1000
    return this.db.collection('organizations').updateOne({
      _id: ObjectId(orgId)
    }, {
      $set: {
        monthlyDonation: donationInMc !== 0,
        donationAmount: donationInMc,
        globalDonation
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
}

module.exports = OrganizationDbController
