class AdvertiserAuthController {
  constructor ({ docs, config, common }) {
    this.docs = docs
    this.common = common
    this.config = config
    this.constants = config.getAuthConfig().Advertiser
  }

  /* <web session> */
  async createWebSession ({ advertiserId }) {
    const sessionId = this.common.generateRandomToken()
    const sessionItem = {
      sessionId,
      advertiserId,
      expiration: this.common.getUnixTimestampPlus(this.constants.ADVERTISER_WEB_SESSION_TIMEOUT)
    }
    await this.docs.put({
      TableName: this.constants.ADVERTISER_WEB_SESSION_TABLE,
      Item: sessionItem
    }).promise()
    return sessionId
  }

  async getWebSession ({ sessionId }) {
    return this.common.getAndUpdateWebSession({
      tableName: this.constants.ADVERTISER_WEB_SESSION_TABLE,
      sessionId,
      expirationIncrementSeconds: this.constants.ADVERTISER_WEB_SESSION_TIMEOUT
    })
  }

  async deleteWebSession ({ sessionId }) {
    if (!sessionId) { return }
    return this.docs.delete({
      TableName: this.constants.ADVERTISER_WEB_SESSION_TABLE,
      Key: { sessionId }
    }).promise()
  }
  /* </web session> */

  /* <registration> */
  async beginRegistration ({ email }) {
    const registrationToken = this.common.generateRandomToken()
    const expiration = this.common.getUnixTimestampPlus(this.constants.ADVERTISER_REGISTRATION_TIMEOUT)

    await this.docs.put({
      TableName: this.constants.ADVERTISER_REGISTRATION_TABLE,
      Item: { email, registrationToken, expiration }
    }).promise()

    return { registrationToken }
  }

  async completeRegistration ({ email, token }) {
    try {
      await this.docs.delete({
        TableName: this.constants.ADVERTISER_REGISTRATION_TABLE,
        Key: { email },
        ConditionExpression: 'registrationToken = :token AND expiration >= :now',
        ExpressionAttributeValues: {
          ':token': token,
          ':now': Date.now() / 1000
        },
        ReturnValues: 'ALL_OLD'
      }).promise()
      return true
    } catch (e) {
      if (e.code === 'ConditionalCheckFailedException') {
        // this means the token didn't match or has expired
        return false
      }
      throw e
    }
  }
  /* </registration> */
}

module.exports = AdvertiserAuthController
