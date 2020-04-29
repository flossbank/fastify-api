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

class UserAuthController {
  constructor ({ docs, common }) {
    this.constants = {
      USER_API_KEY_TABLE: 'UserApiKeys',
      USER_WEB_SESSION_TABLE: 'UserWebSessions',
      USER_REGISTRATION_TABLE: 'UserRegistrationTokens',
      USER_LOGIN_TOKEN_TABLE: 'UserLoginTokens',
      USER_WEB_SESSION_TIMEOUT: 7 * 24 * 60 * 60, // 7 days in seconds
      USER_REGISTRATION_TIMEOUT: 15 * 60 * 60, // 15 minutes in seconds
      USER_LOGIN_TIMEOUT: 15 * 60 * 60 // 15 minutes in seconds
    }
    this.docs = docs
    this.common = common
  }

  /* <cli session> */
  async cacheApiKey ({ apiKey, userId }) {
    return this.docs.put({
      TableName: this.constants.USER_API_KEY_TABLE,
      Item: { apiKey, created: Date.now(), id: userId }
    }).promise()
  }
  /* </cli session> */

  /* <web session> */
  async createWebSession ({ userId }) {
    const sessionId = this.common.generateRandomToken()
    const sessionItem = {
      sessionId,
      userId,
      expiration: this.common.getUnixTimestampPlus(this.constants.USER_WEB_SESSION_TIMEOUT)
    }
    await this.docs.put({
      TableName: this.constants.USER_WEB_SESSION_TABLE,
      Item: sessionItem
    }).promise()
    return sessionId
  }

  async getWebSession ({ sessionId }) {
    return this.common.getAndUpdateWebSession({
      tableName: this.constants.USER_WEB_SESSION_TABLE,
      sessionId,
      expirationIncrementSeconds: this.constants.USER_WEB_SESSION_TIMEOUT
    })
  }

  async deleteWebSession ({ sessionId }) {
    return sessionId && this.docs.delete({
      TableName: this.constants.USER_WEB_SESSION_TABLE,
      Key: { sessionId }
    }).promise()
  }
  /* /web session> */

  /* <registration> */
  async beginRegistration ({ email }) {
    const registrationToken = this.common.generateRandomToken()
    const pollingToken = this.common.generateRandomToken()
    const expiration = this.common.getUnixTimestampPlus(this.constants.USER_REGISTRATION_TIMEOUT)

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
    if (!this.common.areTokensEqual(registration.registrationToken, registrationToken)) {
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
  async beginAuthentication ({ userId }) {
    const magicLinkParams = await this.common.generateMagicLinkParams()

    const loginItem = {
      token: magicLinkParams.token,
      userId: userId.toString(),
      expiration: this.common.getUnixTimestampPlus(this.constants.USER_LOGIN_TIMEOUT)
    }
    await this.docs.put({
      TableName: this.constants.USER_LOGIN_TOKEN_TABLE,
      Item: loginItem
    }).promise()

    return magicLinkParams
  }

  async completeAuthentication ({ userId, token }) {
    try {
      await this.docs.delete({
        TableName: this.constants.USER_LOGIN_TOKEN_TABLE,
        Key: { token },
        ConditionExpression: 'userId = :userId AND expiration >= :now',
        ExpressionAttributeValues: {
          ':userId': userId.toString(),
          ':now': Date.now() / 1000
        }
      }).promise()
      return { success: true }
    } catch (e) {
      if (e.code === 'ConditionalCheckFailedException') {
        return { success: false, message: 'user id mismatch or token expired' }
      }
      throw e
    }
  }
  /* </authentication> */
}

module.exports = UserAuthController
