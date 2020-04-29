const crypto = require('crypto')
const got = require('got')
const FormData = require('form-data')
const fastifyPlugin = require('fastify-plugin')
const niceware = require('niceware')

const UserAuth = require('./user')
const AdvertiserAuth = require('./advertiser')

const ApiTableName = 'flossbank_api_keys' // api keys
const AdSessionTableName = 'flossbank_ad_session' // temporary holding ground for cli sessionIds

// General purpose authentication functions with more specific logic nested per usecase
class Auth {
  constructor ({ config, docs }) {
    this.user = new UserAuth({ docs, common: this })
    this.advertiser = new AdvertiserAuth({ docs, common: this })

    this.docs = docs
    this.post = got.post
    this.niceware = niceware
    this.recaptchaSecret = config.getRecaptchaSecret()
  }

  async getAndUpdateWebSession ({ tableName, sessionId, expirationIncrementSeconds }) {
    if (!sessionId) { return }
    try {
      const { Attributes } = await this.docs.update({
        TableName: tableName,
        Key: { sessionId },
        UpdateExpression: 'SET expiration = :newExpiration',
        ConditionExpression: 'expiration >= :now',
        ExpressionAttributeValues: {
          ':now': Date.now() / 1000,
          ':newExpiration': this.getUnixTimestampPlus(expirationIncrementSeconds)
        },
        ReturnValues: 'ALL_OLD'
      }).promise()
      return Attributes
    } catch (e) {
      if (e.code === 'ConditionalCheckFailedException') {
        // this means the token has expired
        return
      }
      throw e
    }
  }

  // Returns auth token or false
  getAuthToken (req) {
    if (!req.headers || !req.headers.authorization) { return false }
    return req.headers.authorization.split(' ').pop()
  }

  async getAdSessionApiKey (req) {
    const token = this.getAuthToken(req)
    if (!token) { return null }
    return this.getApiKey(token)
  }

  areTokensEqual (tokenA, tokenB) {
    return crypto.timingSafeEqual(
      Buffer.from(tokenA, 'hex'),
      Buffer.from(tokenB, 'hex')
    )
  }

  getUnixTimestampPlus (seconds) {
    return Math.floor(Date.now() / 1000) + seconds
  }

  generateRandomToken () {
    return crypto.randomBytes(32).toString('hex')
  }

  async generateMagicLinkParams () {
    const token = this.generateRandomToken()
    const code = this.niceware.generatePassphrase(4) // 2 words pls
      .map(([first, ...rest]) => `${first.toUpperCase()}${rest.join('')}`) // title case pls
      .join(' ') // as a string pls
    return { token, code }
  }

  async isRecaptchaResponseValid ({ recaptchaResponse }) {
    const form = new FormData()
    form.append('secret', await this.recaptchaSecret)
    form.append('response', recaptchaResponse)
    const res = await this.post('https://www.google.com/recaptcha/api/siteverify', { body: form })
    const body = JSON.parse(res.body)
    return body.success
  }

  async getApiKey (key) {
    if (!key) { return null }
    try {
      const { Item } = await this.docs.get({
        TableName: ApiTableName,
        Key: { key }
      }).promise()
      return Item
    } catch (_) {
      return null
    }
  }

  async createAdSession (req) {
    // standard authorization header is `{ authorization: 'Bearer token' }`
    const apiKey = req.headers.authorization.split(' ').pop()
    const sessionId = crypto.randomBytes(16).toString('hex')
    await this.docs.put({
      TableName: AdSessionTableName,
      Item: {
        sessionId,
        apiKey,
        created: Date.now()
      }
    }).promise()
    return sessionId
  }
}

exports.Auth = Auth

exports.authPlugin = (auth) => fastifyPlugin(async (fastify) => {
  fastify.decorate('auth', auth)
})
