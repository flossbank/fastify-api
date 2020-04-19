const crypto = require('crypto')
const AWS = require('aws-sdk')
const got = require('got')
const FormData = require('form-data')
const fastifyPlugin = require('fastify-plugin')
const Cache = require('quick-lru')
const niceware = require('niceware')
const { config } = require('../config')
const {
  ADVERTISER_SESSION_KEY,
  MAINTAINER_SESSION_KEY,
  USER_SESSION_KEY
} = require('../helpers/constants')
const { activationEmails } = require('../helpers/activationEmails')
const magicLinkEmails = require('../helpers/magicLinkEmails')

AWS.config.update(config.getAwsConfig())

const docs = new AWS.DynamoDB.DocumentClient()
const ses = new AWS.SES()
const UserTableName = 'flossbank_user_auth' // user tokens
const ApiTableName = 'flossbank_api_keys' // api keys
const AdSessionTableName = 'flossbank_ad_session' // temporary holding ground for cli sessionIds
const MaintainerSessionTableName = 'flossbank_maintainer_session'
const AdvertiserSessionTableName = 'flossbank_advertiser_session'
const UserSessionTableName = 'flossbank_user_session'

const oneMinute = (60 * 1000)
const fifteenMinutesExpirationMS = (15 * 60 * 1000)
const weekExpiration = (7 * 24 * 60 * 1000)

function Auth () {
  this.docs = docs // to ease testing
  this.ses = ses
  this.post = got.post
  this.niceware = niceware

  this.checkCache = new Cache({ maxSize: 1000 }) // keep track of last 1000 auth checks on this host
  this.recaptchaSecret = config.getRecaptchaSecret()
}

// Kind of auth tokens enum
Auth.prototype.authKinds = {
  USER: 'USER',
  MAINTAINER: 'MAINTAINER',
  ADVERTISER: 'ADVERTISER'
}

Auth.prototype.hasUserAuthCheckedInPastOneMinute = function hasUserAuthCheckedInPastOneMinute (email) {
  if (!this.checkCache.has(email)) return false
  return Date.now() - this.checkCache.get(email) <= oneMinute
}

Auth.prototype.recordUserAuthCheck = function recordUserAuthCheck (email) {
  this.checkCache.set(email, Date.now())
}

Auth.prototype.updateUserOptOutSetting = async function updateUserOptOutSetting (key, optOut) {
  return this.docs.update({
    TableName: ApiTableName,
    Key: { key },
    UpdateExpression: 'SET optOutOfAds = :setting',
    ExpressionAttributeValues: { ':setting': optOut }
  }).promise()
}

// Returns auth token or false
Auth.prototype.getAuthToken = function getAuthToken (req) {
  if (!req.headers || !req.headers.authorization) return false
  return req.headers.authorization.split(' ').pop()
}

Auth.prototype.getSessionToken = function getSessionToken (req, kind) {
  let cookieKey
  switch (kind) {
    case this.authKinds.ADVERTISER:
      cookieKey = ADVERTISER_SESSION_KEY
      break
    case this.authKinds.MAINTAINER:
      cookieKey = MAINTAINER_SESSION_KEY
      break
    case this.authKinds.USER:
      cookieKey = USER_SESSION_KEY
      break
    default:
      return false
  }
  if (!req.cookies || !req.cookies[cookieKey]) return false
  return req.cookies[cookieKey]
}

Auth.prototype.getAdSessionApiKey = async function getAdSessionApiKey (req) {
  const token = this.getAuthToken(req)
  if (!token) return null

  return this.getApiKey(token)
}

// Returns a UI Session | null
Auth.prototype.getUISession = async function getUISession (req, kind) {
  const token = this.getSessionToken(req, kind)
  if (!token) return null

  let item, Item
  // Validate based on the type of session being auth'd
  try {
    switch (this.authKinds[kind]) {
      case (this.authKinds.MAINTAINER):
        ({ Item } = await this.docs.get({
          TableName: MaintainerSessionTableName,
          Key: { sessionId: token }
        }).promise())
        item = Item
        break
      case (this.authKinds.ADVERTISER):
        ({ Item } = await this.docs.get({
          TableName: AdvertiserSessionTableName,
          Key: { sessionId: token }
        }).promise())
        item = Item
        break
      case (this.authKinds.USER):
        ({ Item } = await this.docs.get({
          TableName: UserSessionTableName,
          Key: { sessionId: token }
        }).promise())
        item = Item
        break
      default:
        console.error('Attempting to validate invalid session kind')
        return null
    }
  } catch (err) {
    console.error(err)
    return null
  }

  if (!item.sessionId || item.expires < Date.now()) {
    return null
  }

  return item
}

Auth.prototype.generateToken = async function generateToken (email, kind) {
  if (!email) throw new Error('email is required')
  if (!this.authKinds[kind]) throw new Error('Invalid kind of token')
  const token = crypto.randomBytes(32).toString('hex')

  await this.docs.put({
    TableName: UserTableName,
    Item: { email, token, kind, expires: Date.now() + fifteenMinutesExpirationMS }
  }).promise()

  return token
}

Auth.prototype.sendMagicLink = async function sendMagicLink (email, kind) {
  const token = await this.generateToken(email, kind)

  const code = this.niceware.generatePassphrase(4) // 2 words pls
    .map(([first, ...rest]) => `${first.toUpperCase()}${rest.join('')}`) // title case pls
    .join(' ') // as a string pls

  await this.ses.sendEmail({
    Destination: { ToAddresses: [email] },
    Source: 'Flossbank <admin@flossbank.com>',
    Message: magicLinkEmails[kind](email, token, code)
  }).promise()

  return code
}

Auth.prototype.sendToken = async function sendToken (email, kind) {
  const token = await this.generateToken(email, kind)
  return this.ses.sendEmail({
    Destination: { ToAddresses: [email] },
    Source: 'Flossbank <admin@flossbank.com>',
    Message: activationEmails[kind](email, token)
  }).promise()
}

Auth.prototype.deleteToken = async function deleteToken (email) {
  if (!email) return
  return this.docs.delete({
    TableName: UserTableName,
    Key: { email }
  }).promise()
}

Auth.prototype.validateToken = async function validateToken (email, hexUserToken, tokenKind) {
  if (!email || !hexUserToken || !tokenKind || !this.authKinds[tokenKind]) return false

  const { Item: user } = await this.docs.get({
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
    await this.deleteToken(email)
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
    await this.deleteToken(email)
    return false
  }

  if (expires - Date.now() <= 0) {
    console.error('Attempt to validate expired token %s for %s', hexUserToken, email)
    await this.deleteToken(email)
    return false
  }

  if (!valid) {
    await this.docs.update({
      TableName: UserTableName,
      Key: { email },
      UpdateExpression: 'SET valid = :true',
      ExpressionAttributeValues: { ':true': true }
    }).promise()
  }

  return true
}

Auth.prototype.validateCaptcha = async function validateCaptcha (email, hexUserToken, response) {
  if (!response || !this.validateToken(email, hexUserToken, this.authKinds.USER)) return

  const form = new FormData()
  form.append('secret', this.recaptchaSecret)
  form.append('response', response)
  const res = await this.post('https://www.google.com/recaptcha/api/siteverify', { body: form })
  const body = JSON.parse(res.body)

  if (!body.success) {
    await this.deleteToken(email)
    return
  }

  await this.deleteToken(email)

  return true
}

Auth.prototype.cacheApiKey = async function cacheApiKey (apiKey, userId) {
  return this.docs.put({
    TableName: ApiTableName,
    Item: {
      key: apiKey,
      created: Date.now(),
      id: userId
    }
  }).promise()
}

Auth.prototype.getApiKey = async function getApiKey (key) {
  if (!key) return null

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

Auth.prototype.createAdSession = async function createAdSession (req) {
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

Auth.prototype.createMaintainerSession = async function createMaintainerSession (maintainerId) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  await this.docs.put({
    TableName: MaintainerSessionTableName,
    Item: { sessionId, expires: Date.now() + weekExpiration, maintainerId }
  }).promise()
  return sessionId
}

Auth.prototype.deleteMaintainerSession = async function deleteMaintainerSession (sessionId) {
  if (!sessionId) return
  return this.docs.delete({
    TableName: MaintainerSessionTableName,
    Key: { sessionId }
  }).promise()
}

Auth.prototype.createAdvertiserSession = async function createAdvertiserSession (advertiserId) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  await this.docs.put({
    TableName: AdvertiserSessionTableName,
    Item: { sessionId, expires: Date.now() + weekExpiration, advertiserId }
  }).promise()
  return sessionId
}

Auth.prototype.deleteAdvertiserSession = async function deleteAdvertiserSession (sessionId) {
  if (!sessionId) return
  return this.docs.delete({
    TableName: AdvertiserSessionTableName,
    Key: { sessionId }
  }).promise()
}

Auth.prototype.createUserSession = async function createUserSession (userId) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  await this.docs.put({
    TableName: UserSessionTableName,
    Item: { sessionId, expires: Date.now() + weekExpiration, userId }
  }).promise()
  return sessionId
}

Auth.prototype.deleteUserSession = async function deleteUserSession (sessionId) {
  if (!sessionId) return
  return this.docs.delete({
    TableName: UserSessionTableName,
    Key: { sessionId }
  }).promise()
}

exports.Auth = Auth

exports.authPlugin = (auth) => fastifyPlugin(async (fastify) => {
  fastify.decorate('auth', auth)
})
