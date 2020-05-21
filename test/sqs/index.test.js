const test = require('ava')
const sinon = require('sinon')
const { Sqs } = require('../../sqs')

test.beforeEach((t) => {
  t.context.sqs = new Sqs({
    sqs: {
      sendMessage: sinon.stub().returns({
        promise: sinon.stub()
      })
    },
    config: {
      getDistributeDonationQueueUrl: sinon.stub(),
      getSessionCompleteQueueUrl: sinon.stub()
    }
  })
})

test('sqs | send session complete message', async (t) => {
  t.context.sqs.sendSessionCompleteMessage({ help: 'me' })
  t.deepEqual(t.context.sqs.sqs.sendMessage.lastCall.args, [{
    QueueUrl: t.context.sqs.config.getSessionCompleteQueueUrl(),
    MessageBody: JSON.stringify({ help: 'me' })
  }])
})

test('sqs | send distribute donation message', async (t) => {
  t.context.sqs.sendDistributeDonationMessage({ customerId: 'mary' })
  t.deepEqual(t.context.sqs.sqs.sendMessage.lastCall.args, [{
    QueueUrl: t.context.sqs.config.getDistributeDonationQueueUrl(),
    MessageBody: JSON.stringify({ customerId: 'mary' })
  }])
})
