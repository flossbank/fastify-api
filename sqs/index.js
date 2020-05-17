const fastifyPlugin = require('fastify-plugin')

class Sqs {
  constructor ({ config, sqs }) {
    this.config = config
    this.sqs = sqs
  }

  async sendSessionCompleteMessage (payload) {
    const url = this.config.getSessionCompleteQueueUrl()
    return this.sendMessage(url, payload)
  }

  async sendDistributeDonationMessage (payload) {
    const url = this.config.getDistributeDonationQueueUrl()
    return this.sendMessage(url, payload)
  }

  async sendMessage (url, payload) {
    return this.sqs.sendMessage({
      QueueUrl: url,
      MessageBody: JSON.stringify(payload)
    }).promise()
  }
}

exports.Sqs = Sqs

exports.sqsPlugin = (sqs) => fastifyPlugin(async (fastify) => {
  fastify.decorate('sqs', sqs)
})
