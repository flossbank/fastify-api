const fastifyPlugin = require('fastify-plugin')
const AWS = require('aws-sdk')
const config = require('../config')

AWS.config.update(config.getAwsConfig())

function Sqs () {
  this.sqs = new AWS.SQS()
}

Sqs.prototype.sendMessage = async function sendMessage (payload) {
  return this.sqs.sendMessage({
    QueueUrl: config.getQueueUrl(),
    MessageBody: JSON.stringify(payload)
  }).promise()
}

exports.Sqs = Sqs

exports.sqsPlugin = (sqs) => fastifyPlugin(async (fastify) => {
  fastify.decorate('sqs', sqs)
})
