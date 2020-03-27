const fastifyPlugin = require('fastify-plugin')
const AWS = require('aws-sdk')
const { config } = require('../config')
const { subscribeEmails } = require('../helpers/subscribeEmails')

AWS.config.update(config.getAwsConfig())

function Email () {
  this.ses = new AWS.SES()
}

Email.prototype.sendSubscribeEmail = async function sendSubscribeEmail (email) {
  return this.ses.sendEmail({
    Destination: { ToAddresses: [email] },
    Source: 'Flossbank <admin@flossbank.com>',
    Message: subscribeEmails.SUBSCRIBE(email)
  }).promise()
}

exports.Email = Email

exports.emailPlugin = (email) => fastifyPlugin(async (fastify) => {
  fastify.decorate('email', email)
})
