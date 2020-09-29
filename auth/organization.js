class OrganizationAuthController {
  constructor ({ docs, config, common }) {
    this.constants = config.getAuthConfig().User
    this.docs = docs
    this.common = common
    this.config = config
  }

  /* <web session> */
  async updateWebSession ({ sessionId, organizationId }) {
    return this.common.addOrganizationToWebSession({
      tableName: this.constants.USER_WEB_SESSION_TABLE,
      sessionId,
      organizationId
    })
  }
  /* /web session> */
}

module.exports = OrganizationAuthController
