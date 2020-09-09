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
      getDistributeUserDonationQueueUrl: sinon.stub(),
      getDistributeOrgDonationQueueUrl: sinon.stub().returns('asdf'),
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

test('sqs | send distribute user donation message', async (t) => {
  t.context.sqs.sendDistributeUserDonationMessage({ customerId: 'mary' })
  t.deepEqual(t.context.sqs.sqs.sendMessage.lastCall.args, [{
    QueueUrl: t.context.sqs.config.getDistributeUserDonationQueueUrl(),
    MessageBody: JSON.stringify({ customerId: 'mary' })
  }])
})

test('sqs | send distribute org donation message', async (t) => {
  t.context.sqs.sendDistributeOrgDonationMessage({ customerId: 'mary' })
  t.deepEqual(t.context.sqs.sqs.sendMessage.lastCall.args, [{
    QueueUrl: t.context.sqs.config.getDistributeOrgDonationQueueUrl(),
    MessageBody: JSON.stringify({ customerId: 'mary' })
  }])
})
