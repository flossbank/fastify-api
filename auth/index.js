const crypto = require('crypto')
const got = require('got')
const FormData = require('form-data')
const fastifyPlugin = require('fastify-plugin')
const niceware = require('eff-diceware-passphrase')

const UserAuth = require('./user')
const AdvertiserAuth = require('./advertiser')
const MaintainerAuth = require('./maintainer')

// General purpose authentication functions with more specific logic nested per usecase
class Auth {
  constructor ({ config, docs }) {
    this.user = new UserAuth({ docs, config, common: this })
    this.advertiser = new AdvertiserAuth({ docs, config, common: this })
    this.maintainer = new MaintainerAuth({ docs, config, common: this })

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

  areTokensEqual (tokenA, tokenB) {
    if (!tokenA || !tokenB) return false
    if (tokenA.length !== tokenB.length) return false
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

  generateMagicLinkParams () {
    const token = this.generateRandomToken()
    const code = this.niceware(2) // 2 words pls
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
}

exports.Auth = Auth

exports.authPlugin = (auth) => fastifyPlugin(async (fastify) => {
  fastify.decorate('auth', auth)
})
