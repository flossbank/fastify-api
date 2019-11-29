const test = require('ava')
const sinon = require('sinon')
const auth = require('../../../auth')
const res = require('../../helpers/_response')
const validate = require('../../../api/auth/validate-captcha')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(auth, 'validateCaptcha')
})

test.afterEach(() => {
  console.error.reset()
  res.status.reset()
})

test.after(() => {
  console.error.restore()
  auth.validateCaptcha.restore()
})

test('missing params', async (t) => {
  await validate({}, res)
  t.true(res.status.calledWith(400))
  res.status.reset()

  await validate({ body: {} }, res)
  t.true(res.status.calledWith(400))
  res.status.reset()

  await validate({ body: { email: 'email' } }, res)
  t.true(res.status.calledWith(400))
  res.status.reset()

  await validate({ body: { token: 'token' } }, res)
  t.true(res.status.calledWith(400))

  await validate({ body: { response: 'response' } }, res)
  t.true(res.status.calledWith(400))

  await validate({ body: { email: 'email', token: 'token' } }, res)
  t.true(res.status.calledWith(400))

  await validate({ body: { email: 'email', response: 'response' } }, res)
  t.true(res.status.calledWith(400))

  await validate({ body: { token: 'email', response: 'response' } }, res)
  t.true(res.status.calledWith(400))
})

test('unauthorized', async (t) => {
  await validate({ body: { email: 'email', token: 'token', response: 'response' } }, res)
  t.true(auth.validateCaptcha.calledWith('email', 'token', 'response'))
  t.true(res.status.calledWith(401))
})

test('success', async (t) => {
  auth.validateCaptcha.returns('apiKey')
  await validate({ body: { email: 'email', token: 'token', response: 'response' } }, res)
  t.true(auth.validateCaptcha.calledWith('email', 'token', 'response'))
  t.true(res.send.calledWith({ apiKey: 'apiKey' }))
})

test('validation failure', async (t) => {
  auth.validateCaptcha.rejects()
  await validate({ body: { email: 'email', token: 'token', response: 'response' } }, res)
  t.true(auth.validateCaptcha.calledWith('email', 'token', 'response'))
  t.true(console.error.calledOnce)
  t.true(res.status.calledWith(500))
})
