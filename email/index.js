const fastifyPlugin = require('fastify-plugin')
const AWS = require('aws-sdk')
const b36 = require('b36')
const { config } = require('../config')

AWS.config.update(config.getAwsConfig())

const FLOSSBANK_ADMIN = 'Flossbank <admin@flossbank.com>'
const FLOSSBANK_JOEL = 'Flossbank <joel@flossbank.com>'
const DEFAULT_CONFIG_SET = 'default-config-set'

// templates
const USER_ACTIVATION_TEMPLATE = 'UserActivation'
const USER_MAGIC_LINK_TEMPLATE = 'UserMagicLink'
const ADVERTISER_ACTIVATION_TEMPLATE = 'AdvertiserActivation'
const MAINTAINER_ACTIVATION_TEMPLATE = 'MaintainerActivation'
const BETA_SUBSCRIBE_TEMPLATE = 'BetaSubscribe'

class Email {
  constructor () {
    this.ses = new AWS.SES()
  }

  async sendUserActivationEmail (email, token) {
    const activationUrl = this.createActivationUrl(email, token, 'user')
    return this.ses.sendTemplatedEmail({
      Destination: { ToAddresses: [email] },
      Source: FLOSSBANK_ADMIN,
      ConfigurationSetName: DEFAULT_CONFIG_SET,
      Template: USER_ACTIVATION_TEMPLATE,
      TemplateData: JSON.stringify({ activationUrl })
    }).promise()
  }

  async sendAdvertiserActivationEmail (email, token) {
    const activationUrl = this.createActivationUrl(email, token, 'advertiser')
    return this.ses.sendTemplatedEmail({
      Destination: { ToAddresses: [email] },
      Source: FLOSSBANK_ADMIN,
      ConfigurationSetName: DEFAULT_CONFIG_SET,
      Template: ADVERTISER_ACTIVATION_TEMPLATE,
      TemplateData: JSON.stringify({ activationUrl })
    }).promise()
  }

  async sendMaintainerActivationEmail (email, token) {
    const activationUrl = this.createActivationUrl(email, token, 'maintainer')
    return this.ses.sendTemplatedEmail({
      Destination: { ToAddresses: [email] },
      Source: FLOSSBANK_ADMIN,
      ConfigurationSetName: DEFAULT_CONFIG_SET,
      Template: MAINTAINER_ACTIVATION_TEMPLATE,
      TemplateData: JSON.stringify({ activationUrl })
    }).promise()
  }

  async sendBetaSubscriptionEmail (email, token) {
    const unsubscribeUrl = this.createUnsubscribeUrl(email, token)
    return this.ses.sendTemplatedEmail({
      Destination: { ToAddresses: [email] },
      Source: FLOSSBANK_JOEL,
      ConfigurationSetName: DEFAULT_CONFIG_SET,
      Template: BETA_SUBSCRIBE_TEMPLATE,
      TemplateData: JSON.stringify({ unsubscribeUrl })
    }).promise()
  }

  async sendUserMagicLinkEmail (email, token, code) {
    const loginUrl = this.createLoginUrl(email, token, 'user')
    return this.ses.sendTemplatedEmail({
      Destination: { ToAddresses: [email] },
      Source: FLOSSBANK_ADMIN,
      ConfigurationSetName: DEFAULT_CONFIG_SET,
      Template: USER_MAGIC_LINK_TEMPLATE,
      TemplateData: JSON.stringify({ code, loginUrl })
    }).promise()
  }

  encodeEmail (email) {
    return b36.encode(Buffer.from(email))
  }

  createActivationUrl (email, token, kind) {
    const e = this.encodeEmail(email)
    return `https://verification.flossbank.com/?e=${e}&token=${token}&kind=${kind}`
  }

  createLoginUrl (email, token, kind) {
    const e = this.encodeEmail(email)
    return `https://login.flossbank.com/?e=${e}&token=${token}&kind=${kind}`
  }

  createUnsubscribeUrl (email, token) {
    const e = this.encodeEmail(email)
    return `https://flossbank.com/beta/unsubscribe?e=${e}&token=${token}`
  }
}

exports.Email = Email

exports.emailPlugin = (email) => fastifyPlugin(async (fastify) => {
  fastify.decorate('email', email)
})
