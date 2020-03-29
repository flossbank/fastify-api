const crypto = require('crypto')
const AWS = require('aws-sdk')
const got = require('got')
const FormData = require('form-data')
const fastifyPlugin = require('fastify-plugin')
const Cache = require('quick-lru')
const niceware = require('niceware')
const { config } = require('../config')
const { advertiserSessionKey, maintainerSessionKey } = require('../helpers/constants')
const { activationEmails } = require('../helpers/email')
const magicLinkEmails = require('../helpers/magicLinkEmails')

AWS.config.update(config.getAwsConfig())

const docs = new AWS.DynamoDB.DocumentClient()
const ses = new AWS.SES()
const UserTableName = 'flossbank_user_auth' // user tokens
const ApiTableName = 'flossbank_api_keys' // api keys
const ApiTableEmailIndex = 'email-index'
const AdSessionTableName = 'flossbank_ad_session' // temporary holding ground for cli sessionIds
const MaintainerSessionTableName = 'flossbank_maintainer_session' // holding ground for maintainer sessions
const AdvertiserSessionTableName = 'flossbank_advertiser_session' // holding ground for advertiser sessions

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

Auth.prototype.checkApiKeyForUser = async function checkApiKeyForUser (email, key) {
  if (!email || !key) return false

  try {
    const { Item } = await this.docs.get({
      TableName: ApiTableName,
      Key: { key }
    }).promise()
    if (!Item) return false
    return Item.email === email
  } catch (_) {
    return false
  }
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
      cookieKey = advertiserSessionKey
      break
    case this.authKinds.MAINTAINER:
      cookieKey = maintainerSessionKey
      break
    default:
      return false
  }
  if (!req.cookies || !req.cookies[cookieKey]) return false
  return req.cookies[cookieKey]
}

Auth.prototype.isAdSessionAllowed = async function isAdSessionAllowed (req) {
  const token = this.getAuthToken(req)
  if (!token) return false

  return this.validateApiKey(token)
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
}

Auth.prototype.sendMagicLink = async function sendMagicLink (email, kind) {
  const token = this.generateToken(email, kind)

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
  const token = this.generateToken(email, kind)
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

Auth.prototype.getOrCreateApiKey = async function getOrCreateApiKey (email) {
  // there might be a fancy way to do this with 1 API call (condition expression ?)
  // but i don't know how and this isn't a time-super-sensitive api

  // we want unique emails only in this table, but unfortunately spammers can just add +something (a tag)
  // to their email prefix and the query will not find them in the table. we want to honor the +something
  // in all user-facing communication (not supporting address tags is really bad UX),
  // but we need to strip it off to maintain the email uniqueness constraint in this table.
  // the reason we actually care about email uniqueness here (and maybe not in an advertiser registration)
  // is that if it's "too easy" for users to generate many API keys, it's much easier for them to abuse our platform.

  /* --- explanation of regex: ---
    ^         beginning of string
    (         match group #1 (prefix)
      [^+]+   one or more chars that aren't "+"
    )
    (         match group #2 (tag)
      \+.*    a "+' char followed by 0 or more of any char
    )*        0 or more of match group #2
    @         @ sign
    (         match group #3 (suffix)
      .+      1 or more of any char
    )
    $         end of string
  */
  const emailParts = /^([^+]+)(\+.*)*@(.+)$/.exec(email)
  if (!emailParts) {
    // if the regex doesn't match anything, there's 0% chance this is a valid email address
    // which should be impossible because of fastify schema validations, but throwing a check in here
    // regardless
    throw new Error(`invalid email provided to getOrCreateApiKey: ${email}`)
  }

  // /regex/.exec returns an array-like list of [full string, match 1, match 2, ..., match n]
  // in our case [full email, local part, address tag, domain part] -- we only care abt local-part@domain-part
  const [, prefix,, suffix] = emailParts
  const taglessEmail = `${prefix}@${suffix}`

  // try to get first
  const { Items } = (await this.docs.query({
    TableName: ApiTableName,
    IndexName: ApiTableEmailIndex,
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': taglessEmail }
  }).promise())

  const foundEntry = Items.pop()

  const key = foundEntry ? foundEntry.key : crypto.randomBytes(32).toString('hex')

  await this.docs.update({
    TableName: ApiTableName,
    Key: { key },
    UpdateExpression: 'SET email = if_not_exists (email, :email), created = if_not_exists (created, :now) ADD keysRequested :one',
    ExpressionAttributeValues: {
      ':email': taglessEmail,
      ':now': Date.now(),
      ':one': 1
    }
  }).promise()

  return key
}

Auth.prototype.validateApiKey = async function validateApiKey (key) {
  if (!key) return false

  try {
    const { Item } = await this.docs.get({
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

exports.Auth = Auth

exports.authPlugin = (auth) => fastifyPlugin(async (fastify) => {
  fastify.decorate('auth', auth)
})
