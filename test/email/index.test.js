const test = require('ava')
const sinon = require('sinon')
const { Email } = require('../../email')

test.beforeEach((t) => {
  t.context.email = new Email()
  t.context.email.ses = {
    sendEmail: sinon.stub().returns({
      promise: sinon.stub()
    })
  }
})

test('email | sendSubscribeEmail', async (t) => {
  await t.context.email.sendSubscribeEmail('peterpan@flossbank.com')
  t.deepEqual(t.context.email.ses.sendEmail.lastCall.args[0].Destination.ToAddresses,
    ['peterpan@flossbank.com']
  )
})
