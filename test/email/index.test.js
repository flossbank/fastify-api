const test = require('ava')
const sinon = require('sinon')
const { Email } = require('../../email')

test.beforeEach((t) => {
  t.context.email = new Email({
    ses: {
      sendTemplatedEmail: sinon.stub().returns({ promise: sinon.stub() }),
      sendEmail: sinon.stub().returns({ promise: sinon.stub() })
    }
  })
})

test('sendUserActivationEmail creates proper url', async (t) => {
  const { email } = t.context
  await email.sendUserActivationEmail('foo', 'bar')
  const sesArgs = email.ses.sendTemplatedEmail.lastCall.args
  t.deepEqual(sesArgs[0].TemplateData, JSON.stringify({
    activationUrl: 'https://flossbank.com/verify?e=3zvxr&token=bar'
  }))
})

test('sendContactUsEmail sends proper contact us email', async (t) => {
  const { email } = t.context
  const topic = 'foo'
  const name = 'bar'
  const body = 'helpz'
  await email.sendContactUsEmail({ email, topic, name, body })
  const sesArgs = email.ses.sendEmail.lastCall.args
  t.deepEqual(sesArgs[0].Message.Body.Text.Data, `${topic} from: ${name}, ${email},\r\n${body}`)
})

test('sendAdvertiserActivationEmail creates proper url', async (t) => {
  const { email } = t.context
  await email.sendAdvertiserActivationEmail('foo', 'bar')
  const sesArgs = email.ses.sendTemplatedEmail.lastCall.args
  t.deepEqual(sesArgs[0].TemplateData, JSON.stringify({
    activationUrl: 'https://flossbank.com/verify?e=3zvxr&token=bar'
  }))
})

test('sendMaintainerActivationEmail creates proper url', async (t) => {
  const { email } = t.context
  await email.sendMaintainerActivationEmail('foo', 'bar')
  const sesArgs = email.ses.sendTemplatedEmail.lastCall.args
  t.deepEqual(sesArgs[0].TemplateData, JSON.stringify({
    activationUrl: 'https://flossbank.com/verify?e=3zvxr&token=bar'
  }))
})

test('sendBetaSubscriptionEmail creates proper url', async (t) => {
  const { email } = t.context
  await email.sendBetaSubscriptionEmail('foo', 'bar')
  const sesArgs = email.ses.sendTemplatedEmail.lastCall.args
  t.deepEqual(sesArgs[0].TemplateData, JSON.stringify({
    unsubscribeUrl: 'https://flossbank.com/beta/unsubscribe?e=3zvxr&token=bar'
  }))
})

test('sendUserMagicLinkEmail creates proper url', async (t) => {
  const { email } = t.context
  await email.sendUserMagicLinkEmail('foo', { token: 'bar', code: 'Code Words' })
  const sesArgs = email.ses.sendTemplatedEmail.lastCall.args
  t.deepEqual(sesArgs[0].TemplateData, JSON.stringify({
    code: 'Code Words',
    loginUrl: 'https://flossbank.com/complete-login?e=3zvxr&token=bar'
  }))
})
