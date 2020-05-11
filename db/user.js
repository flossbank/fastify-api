const crypto = require('crypto')
const { ObjectId } = require('mongodb')

class UserDbController {
  constructor ({ db }) {
    this.db = db
  }

  async getUserByEmail ({ email }) {
    const user = await this.db.collection('users').findOne({ email })

    if (!user) return user

    const { _id: id, ...rest } = user
    return { id, ...rest }
  }

  async getUserById ({ userId }) {
    const user = await this.db.collection('users').findOne({ _id: ObjectId(userId) })

    if (!user) return user

    const { _id: id, ...rest } = user
    return { id, ...rest }
  }

  async createUser ({ email }) {
    const apiKey = crypto.randomBytes(32).toString('hex')
    const { insertedId } = await this.db.collection('users').insertOne({
      email,
      apiKey,
      billingInfo: {},
      apiKeysRequested: [{ timestamp: Date.now() }]
    })
    return { id: insertedId, apiKey }
  }

  async updateUserHasCardInfo ({ userId, last4 }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { 'billingInfo.last4': last4 }
    })
  }

  async updateUserCustomerId ({ userId, customerId }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { 'billingInfo.customerId': customerId }
    })
  }

  async updateUserApiKeysRequested ({ email }) {
    return this.db.collection('users').updateOne(
      { email },
      { $push: { apiKeysRequested: { timestamp: Date.now() } } })
  }

  async setUserDonation ({ userId, amount }) {
    // Amount in this case is passed in as cents so need to convert to mc
    const donationInMc = amount * 1000
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { 'billingInfo.monthlyDonation': donationInMc !== 0 },
      $push: { 'billingInfo.donationChanges': { timestamp: Date.now(), donationAmount: donationInMc } }
    })
  }

  async updateUserOptOutSetting ({ userId, optOutOfAds }) {
    return this.db.collection('users').updateOne(
      { _id: ObjectId(userId) },
      { $set: { optOutOfAds } }
    )
  }
}

module.exports = UserDbController
