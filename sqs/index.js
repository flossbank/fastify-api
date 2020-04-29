const fastifyPlugin = require('fastify-plugin')
function Sqs ({ config, sqs }) {
  this.config = config
  this.sqs = sqs
}

Sqs.prototype.sendMessage = async function sendMessage (payload) {
  return this.sqs.sendMessage({
    QueueUrl: this.config.getQueueUrl(),
    MessageBody: JSON.stringify(payload)
  }).promise()
}

exports.Sqs = Sqs

exports.sqsPlugin = (sqs) => fastifyPlugin(async (fastify) => {
  fastify.decorate('sqs', sqs)
})
