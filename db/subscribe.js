const crypto = require('crypto')

class SubscribeDbController {
  constructor ({ db }) {
    this.db = db
  }

  async betaSubscribe ({ email }) {
    const token = crypto.randomBytes(32).toString('hex')
    await this.db.collection('betaSubscribers').insertOne({ email, token })
    return token
  }

  async betaUnsubscribe ({ token }) {
    return this.db.collection('betaSubscribers').deleteOne({ token })
  }

  async getBetaSubscribers () {
    return this.db.collection('betaSubscribers').find().toArray()
  }
}

module.exports = SubscribeDbController
