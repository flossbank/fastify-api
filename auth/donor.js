class DonorAuthController {
  constructor ({ docs, config, common }) {
    this.constants = config.getAuthConfig().Donor
    this.docs = docs
    this.common = common
    this.config = config
  }

  async createWebSession ({ token }) {
    const sessionId = this.common.generateRandomToken()
    const sessionItem = {
      sessionId,
      token,
      expiration: this.common.getUnixTimestampPlus(this.constants.DONOR_WEB_SESSION_TIMEOUT)
    }
    await this.docs.put({
      TableName: this.constants.DONOR_WEB_SESSION_TABLE,
      Item: sessionItem
    }).promise()
    return sessionItem
  }

  async getWebSession ({ sessionId }) {
    return this.common.getAndUpdateWebSession({
      tableName: this.constants.DONOR_WEB_SESSION_TABLE,
      sessionId,
      expirationIncrementSeconds: this.constants.DONOR_WEB_SESSION_TIMEOUT
    })
  }

  async deleteWebSession ({ sessionId }) {
    return sessionId && this.docs.delete({
      TableName: this.constants.DONOR_WEB_SESSION_TABLE,
      Key: { sessionId }
    }).promise()
  }
}

module.exports = DonorAuthController
