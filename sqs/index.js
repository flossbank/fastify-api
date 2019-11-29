const AWS = require('aws-sdk')
const config = require('../config')

AWS.config.update(config.getAwsConfig())

const sqs = new AWS.SQS()

exports.sendMessage = async (payload) => {
  return sqs.sendMessage({
    QueueUrl: config.getQueueUrl(),
    MessageBody: JSON.stringify(payload)
  }).promise()
}
