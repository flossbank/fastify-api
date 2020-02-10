const test = require('ava')
const sinon = require('sinon')
const { Sqs } = require('../../sqs')
const { config } = require('../../config')

test.beforeEach((t) => {
  t.context.sqs = new Sqs()
  t.context.sqs.sqs = {
    sendMessage: sinon.stub().returns({
      promise: sinon.stub()
    })
  }
})

test('sqs | sendMessage', async (t) => {
  t.context.sqs.sendMessage({ help: 'me' })
  t.deepEqual(t.context.sqs.sqs.sendMessage.lastCall.args, [{
    QueueUrl: config.getQueueUrl(),
    MessageBody: JSON.stringify({ help: 'me' })
  }])
})
