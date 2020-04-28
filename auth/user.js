const crypto = require('crypto')

const isRegistrationItemValid = (item) => {
  if (!item) {
    return false
  }
  const { email, registrationToken, pollingToken, expiration } = item
  if (!email || !registrationToken || !pollingToken || !expiration) {
    return false
  }
  if (expiration * 1000 < Date.now()) {
    return false
  }

  return true
}

const isRegistrationTokenValid = ({ tokenFromDb, tokenFromUser }) => {
  return crypto.timingSafeEqual(
    Buffer.from(tokenFromDb, 'hex'),
    Buffer.from(tokenFromUser, 'hex')
  )
}

const getUnixTimestampPlus = seconds => Math.floor(Date.now() / 1000) + seconds

class UserAuthController {
  constructor ({ docs, common }) {
    this.constants = {
      USER_API_KEY_TABLE: 'UserApiKeys',
      USER_REGISTRATION_TABLE: 'UserRegistrationTokens',
      USER_REGISTRATION_TIMEOUT: 15 * 60 * 60 // 15 minutes in seconds
    }
    this.docs = docs
    this.common = common
  }

  /* <cli session> */
  async cacheApiKey ({ apiKey, userId }) {
    return this.docs.put({
      TableName: this.constants.USER_API_KEY_TABLE,
      Item: { key: apiKey, created: Date.now(), id: userId }
    }).promise()
  }
  /* </cli session */

  /* <registration> */
  async beginRegistration ({ email }) {
    const registrationToken = crypto.randomBytes(32).toString('hex')
    const pollingToken = crypto.randomBytes(32).toString('hex')
    const expiration = getUnixTimestampPlus(this.constants.USER_REGISTRATION_TIMEOUT)

    await this.docs.put({
      TableName: this.constants.USER_REGISTRATION_TABLE,
      Item: { email, registrationToken, pollingToken, expiration }
    }).promise()

    return { registrationToken }
  }

  async validateRegistration ({ email, registrationToken, recaptchaResponse }) {
    let registration
    try {
      const { Item } = await this.docs.get({
        TableName: this.constants.USER_REGISTRATION_TABLE,
        Key: { email }
      }).promise()
      registration = Item
    } catch (e) {
      console.error(e)
      return false
    }

    if (!isRegistrationItemValid(registration)) {
      return false
    }
    const { registrationToken: tokenFromDb } = registration
    if (!isRegistrationTokenValid({ tokenFromDb, tokenFromUser: registrationToken })) {
      return false
    }
    if (!await this.common.isRecaptchaResponseValid({ recaptchaResponse })) {
      return false
    }

    return true
  }

  async updateRegistrationApiKey ({ email, apiKey }) {
    return this.docs.update({
      TableName: this.constants.USER_REGISTRATION_TABLE,
      Key: { email },
      UpdateExpression: 'SET apiKey = :apiKey',
      ExpressionAttributeValues: { ':apiKey': apiKey }
    }).promise()
  }

  async completeRegistration ({ email, pollingToken }) {
    try {
      const { Attributes } = await this.docs.delete({
        TableName: this.constants.USER_REGISTRATION_TABLE,
        Key: { email },
        ConditionExpression: 'pollingToken = :pollingToken AND attribute_exists (apiKey)',
        ExpressionAttributeValues: { ':pollingToken': pollingToken },
        ReturnValues: 'ALL_OLD'
      }).promise()
      return Attributes && Attributes.apiKey
    } catch (e) {
      if (e.code === 'ConditionalCheckFailedException') {
        // this means the polling token didn't match or the api key isn't ready
        return
      }
      throw e
    }
  }
  /* </registration> */

  /* <authentication> */
  /* </authentication> */
}

module.exports = UserAuthController
