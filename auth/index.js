const crypto = require('crypto')
const AWS = require('aws-sdk')
const got = require('got')
const FormData = require('form-data')
const fastifyPlugin = require('fastify-plugin')
const config = require('../config')
const { activationEmails } = require('../helpers/email')

AWS.config.update(config.getAwsConfig())

const docs = new AWS.DynamoDB.DocumentClient()
const ses = new AWS.SES()
const UserTableName = 'flossbank_user_auth' // user tokens
const ApiTableName = 'flossbank_api_keys' // api keys
const AdSessionTableName = 'flossbank_ad_session' // temporary holding ground for cli sessionIds
const MaintainerSessionTableName = 'flossbank_maintainer_session' // holding ground for maintainer sessions
const AdvertiserSessionTableName = 'flossbank_advertiser_session' // holding ground for advertiser sessions

const fifteenMinutesExpirationMS = (15 * 60 * 1000)
const weekExpiration = (7 * 24 * 60 * 1000)

function Auth () {
  this.docs = docs // to ease testing
  this.ses = ses

  this.recaptchaSecret = config.getRecaptchaSecret()
  if (!this.recaptchaSecret) console.error('No reCAPTCHA secret found in env')
}

// Kind of auth tokens enum
Auth.prototype.authKinds = {
  USER: 'USER',
  MAINTAINER: 'MAINTAINER',
  ADVERTISER: 'ADVERTISER'
}

// Returns auth token or false
Auth.prototype.getAuthToken = function getAuthToken (req) {
  if (!req.headers || !req.headers.authorization) return false
  return req.headers.authorization.split(' ').pop()
}

Auth.prototype.isAdSessionAllowed = async function isAdSessionAllowed (req) {
  const token = this.getAuthToken(req)
  if (!token) return false

  return this.validateApiKey(token)
}

// Returns a UI Session | null
Auth.prototype.getUISession = async function getUISession (req, kind) {
  const token = this.getAuthToken(req)
  if (!token) return null

  let item, Item
  // Validate based on the type of session being auth'd
  try {
    switch (this.authKinds[kind]) {
      case (this.authKinds.MAINTAINER):
        ({ Item } = await docs.get({
          TableName: MaintainerSessionTableName,
          Key: { token }
        }).promise())
        item = Item
        break
      case (this.authKinds.ADVERTISER):
        ({ Item } = await docs.get({
          TableName: AdvertiserSessionTableName,
          Key: { token }
        }).promise())
        item = Item
        break
      default:
        console.error('Attempting to validate invalid session kind')
        return null
    }
  } catch (err) {
    console.error(err.message)
    return null
  }

  if (item.expires > Date.now()) {
    return null
  }

  return item
}

/**  */
Auth.prototype.sendUserToken = async function sendUserToken (email, kind) {
  if (!email) throw new Error('email is required')
  if (!this.authKinds[kind]) throw new Error('Invalid kind of token')
  const token = crypto.randomBytes(32).toString('hex')

  await docs.put({
    TableName: UserTableName,
    Item: { email, token, kind, expires: Date.now() + fifteenMinutesExpirationMS }
  }).promise()

  if (!activationEmails[kind]) throw new Error('No email template for kind ' + kind)

  return ses.sendEmail({
    Destination: { ToAddresses: [email] },
    Source: 'Flossbank <admin@flossbank.com>',
    Message: activationEmails[kind](email, token)
  }).promise()
}

Auth.prototype.deleteUserToken = async function deleteUserToken (email) {
  if (!email) return
  return docs.delete({
    TableName: UserTableName,
    Key: { email }
  }).promise()
}

Auth.prototype.validateUserToken = async function validateUserToken (email, hexUserToken, tokenKind) {
  if (!email || !hexUserToken || !tokenKind || !this.authKinds[tokenKind]) return false

  const { Item: user } = await docs.get({
    TableName: UserTableName,
    Key: { email }
  }).promise()
  if (!user) {
    console.error('Attempt to validate token for invalid email address %s', email)
    return false
  }

  const { token: hexToken, expires, valid, kind } = user
  if (!hexToken || !expires || !kind) {
    console.error('Attempted to validate email %s but found no token or expiration or kind', email)
    await this.deleteUserToken(email)
    return false
  }

  if (kind !== tokenKind) {
    console.error('Attempted to validate token for wrong kind', email)
    return false
  }

  const token = Buffer.from(hexToken, 'hex')
  const userToken = Buffer.from(hexUserToken, 'hex')
  const userTokenValid = crypto.timingSafeEqual(token, userToken)
  if (!userTokenValid) {
    console.error('Attempt to validate invalid token for %s', email)
    await this.deleteUserToken(email)
    return false
  }

  if (expires - Date.now() <= 0) {
    console.error('Attempt to validate expired token %s for %s', hexUserToken, email)
    await this.deleteUserToken(email)
    return false
  }

  if (!valid) {
    await docs.update({
      TableName: UserTableName,
      Key: { email },
      UpdateExpression: 'SET valid = :true',
      ExpressionAttributeValues: { ':true': true }
    }).promise()
  }

  return true
}

Auth.prototype.validateCaptcha = async function validateCaptcha (email, hexUserToken, response) {
  if (!response || !this.validateUserToken(email, hexUserToken, this.authKinds.USER)) return

  const form = new FormData()
  form.append('secret', this.recaptchaSecret)
  form.append('response', response)
  const res = await got.post('https://www.google.com/recaptcha/api/siteverify', { body: form })
  const body = JSON.parse(res.body)

  if (!body.success) {
    await this.deleteUserToken(email)
    return
  }

  await this.deleteUserToken(email)

  return true
}

Auth.prototype.createApiKey = async function createApiKey (email) {
  const key = crypto.randomBytes(32).toString('hex')

  await docs.put({
    TableName: ApiTableName,
    Item: {
      key,
      email,
      adsSeenThisPeriod: 0,
      created: Date.now()
    }
  }).promise()

  return key
}

Auth.prototype.validateApiKey = async function validateApiKey (key) {
  if (!key) return false

  try {
    const { Item } = await docs.get({
      TableName: ApiTableName,
      Key: { key }
    }).promise()
    return !!Item
  } catch (_) {
    return false
  }
}

Auth.prototype.createAdSession = async function createSession (req) {
  // standard authorization header is `{ authorization: 'Bearer token' }`
  const apiKey = req.headers.authorization.split(' ').pop()
  const { packages, registry } = req.body
  const sessionId = crypto.randomBytes(16).toString('hex')
  await docs.put({
    TableName: AdSessionTableName,
    Item: {
      sessionId,
      apiKey,
      registry,
      packages,
      created: Date.now()
    }
  }).promise()
  return sessionId
}

Auth.prototype.completeAdSession = async function completeAdSession (req) {
  if (!req.headers || !req.headers.authorization) return false
  const apiKey = req.headers.authorization.split(' ').pop()
  if (!apiKey) return false
  const { seen } = req.body

  let item
  try {
    const { Attributes } = await docs.update({
      TableName: ApiTableName,
      Key: { key: apiKey },
      UpdateExpression: 'SET adsSeenThisPeriod = adsSeenThisPeriod + :seenLen',
      ConditionExpression: '#key = :key',
      ExpressionAttributeNames: {
        '#key': 'key'
      },
      ExpressionAttributeValues: {
        ':seenLen': seen.length,
        ':key': apiKey
      },
      ReturnValues: 'ALL_OLD'
    }).promise()
    item = Attributes
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') {
      // this means an invalid API key was sent up
      return false
    }
    throw e
  }
  return item
}

Auth.prototype.createMaintainerSession = async function createMaintainerSession (maintainerId) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  await docs.put({
    TableName: MaintainerSessionTableName,
    Item: { sessionId, expires: Date.now() + weekExpiration, maintainerId }
  }).promise()
  return sessionId
}

Auth.prototype.deleteMaintainerSession = async function deleteMaintainerSession (sessionId) {
  if (!sessionId) return
  return docs.delete({
    TableName: MaintainerSessionTableName,
    Key: { sessionId }
  }).promise()
}

Auth.prototype.createAdvertiserSession = async function createAdvertiserSession (advertiserId) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  await docs.put({
    TableName: AdvertiserSessionTableName,
    Item: { sessionId, expires: Date.now() + weekExpiration, advertiserId }
  }).promise()
  return sessionId
}

Auth.prototype.deleteAdvertiserSession = async function deleteAdvertiserSession (sessionId) {
  if (!sessionId) return
  return docs.delete({
    TableName: AdvertiserSessionTableName,
    Key: { sessionId }
  }).promise()
}

exports.Auth = Auth

exports.authPlugin = (auth) => fastifyPlugin(async (fastify) => {
  fastify.decorate('auth', auth)
})
