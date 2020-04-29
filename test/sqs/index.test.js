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
    config: { getQueueUrl: sinon.stub() }
  })
})

test('sqs | sendMessage', async (t) => {
  t.context.sqs.sendMessage({ help: 'me' })
  t.deepEqual(t.context.sqs.sqs.sendMessage.lastCall.args, [{
    QueueUrl: t.context.sqs.config.getQueueUrl(),
    MessageBody: JSON.stringify({ help: 'me' })
  }])
})
