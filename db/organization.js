const { ORG_ROLES } = require('../helpers/constants')
const { ObjectId } = require('mongodb')

class OrganizationDbController {
  constructor ({ db }) {
    this.db = db
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

  async create ({ name, host, userId }) {
    const orgToInsert = {
      name,
      host,
      email: '',
      users: [{
        userId,
        role: ORG_ROLES.WRITE
      }],
      globalDonation: false,
      billingInfo: {},
      donationAmount: 0,
      donationAmountChanges: []
    }
    const { insertedId } = await this.db.collection('organizations').insertOne(orgToInsert)
    return { id: insertedId, ...orgToInsert }
  }
}

module.exports = OrganizationDbController
