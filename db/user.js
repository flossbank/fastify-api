const crypto = require('crypto')
const { ObjectId } = require('mongodb')

class UserDbController {
  constructor ({ db }) {
    this.db = db
  }

  async getByEmail ({ email }) {
    const user = await this.db.collection('users').findOne({ email })

    if (!user) return user

    const { _id: id, ...rest } = user
    return { id, ...rest }
  }

  async getIdByCustomerId ({ customerId }) {
    const user = await this.db.collection('users').findOne({
      'billingInfo.customerId': customerId
    })
    return user && user._id
  }

  async updateGithubId ({ userId, githubId }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { githubId }
    })
  }

  // link registry-specific info to this user account (e.g. username on NPM)
  async linkToRegistry ({ userId, registry, data }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: {
        [registry]: data
      }
    })
  }

  // unlink registry-specific info from this user account (e.g. username on NPM)
  async unlinkFromRegistry ({ userId, registry }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      // https://docs.mongodb.com/manual/reference/operator/update/unset/
      $unset: {
        [registry]: null
      }
    })
  }

  async get ({ userId }) {
    const user = await this.db.collection('users').findOne({ _id: ObjectId(userId) })

    if (!user) return user

    const { _id: id, ...rest } = user
    return { id, ...rest }
  }

  async updateUsername ({ userId, username }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { username }
    })
  }

  async getSessions ({ userId }) {
    try {
      const sessions = await this.db.collection('users').aggregate([
        { $match: { _id: new ObjectId(userId) } },
        { $project: { sessionCount: { $size: '$sessionActivity' } } }
      ]).toArray()
      return sessions.pop()
    } catch (e) {
      // if there is no activity yet, mongo throws 17124 determining size of non-existent array
      if (e.code === 17124) return { sessionCount: 0 }
      throw e
    }
  }

  async mapMaintainerIdsToUsernames ({ pkg }) {
    const mapOfIds = pkg.maintainers.reduce((acc, maintainer) => {
      acc[maintainer.userId] = {
        userId: maintainer.userId,
        revenuePercent: maintainer.revenuePercent
      }
      return acc
    }, {})

    const ids = pkg.maintainers.map((m) => ObjectId(m.userId))
    const usersFromIds = await this.db.collection('users').find({
      _id: { $in: ids }
    }).toArray()

    usersFromIds.forEach((user) => {
      mapOfIds[user._id.toString()].username = user.username
    })

    return Object.values(mapOfIds)
  }

  async create ({ email, referralCode, githubId, username }) {
    const apiKey = crypto.randomBytes(32).toString('hex')
    const userToCreate = {
      email,
      apiKey,
      githubId,
      username: username || null,
      referralCode,
      billingInfo: {},
      apiKeysRequested: []
    }
    const { insertedId } = await this.db.collection('users').insertOne(userToCreate)
    return { id: insertedId, ...userToCreate }
  }

  async updateHasCardInfo ({ userId, last4 }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { 'billingInfo.last4': last4 }
    })
  }

  async updateCustomerId ({ userId, customerId }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { 'billingInfo.customerId': customerId }
    })
  }

  async updateApiKeysRequested ({ email }) {
    return this.db.collection('users').updateOne(
      { email },
      { $push: { apiKeysRequested: { timestamp: Date.now() } } })
  }

  async setDonation ({ userId, amount }) {
    // Amount in this case is passed in as cents so need to convert to mc
    const donationInMc = amount * 1000
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { 'billingInfo.monthlyDonation': donationInMc !== 0 },
      $push: { 'billingInfo.donationChanges': { timestamp: Date.now(), donationAmount: donationInMc } }
    })
  }

  async updateOptOutSetting ({ userId, optOutOfAds }) {
    return this.db.collection('users').updateOne(
      { _id: ObjectId(userId) },
      { $set: { optOutOfAds } }
    )
  }
}

module.exports = UserDbController
