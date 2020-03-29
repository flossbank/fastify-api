const fastifyPlugin = require('fastify-plugin')
const AWS = require('aws-sdk')
const { config } = require('../config')
const { betaEmails } = require('../helpers/betaEmails')

AWS.config.update(config.getAwsConfig())

function Email () {
  this.ses = new AWS.SES()
}

Email.prototype.sendBetaEmail = async function sendBetaEmail (email, token) {
  return this.ses.sendEmail({
    Destination: { ToAddresses: [email] },
    Source: 'Flossbank <joel@flossbank.com>',
    Message: betaEmails.SUBSCRIBE(token)
  }).promise()
}

exports.Email = Email

exports.emailPlugin = (email) => fastifyPlugin(async (fastify) => {
  fastify.decorate('email', email)
})
