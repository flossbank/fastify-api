const test = require('ava')
const sinon = require('sinon')
const auth = require('../../../auth')
const res = require('../../helpers/_response')
const validate = require('../../../api/auth/validate-email')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(auth, 'validateUserToken')
})

test.afterEach(() => {
  console.error.reset()
  res.status.reset()
})

test.after(() => {
  console.error.restore()
  auth.validateUserToken.restore()
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
})

test('unauthorized', async (t) => {
  auth.validateUserToken.returns(false)
  await validate({ body: { email: 'email', token: 'token', kind: auth.authKinds.USER } }, res)
  t.true(auth.validateUserToken.calledWith('email', 'token', auth.authKinds.USER))
  t.true(res.send.calledWith({ valid: false }))
})

test('success', async (t) => {
  auth.validateUserToken.returns(true)
  await validate({ body: { email: 'email', token: 'token', kind: auth.authKinds.USER } }, res)
  t.true(auth.validateUserToken.calledWith('email', 'token', auth.authKinds.USER))
  t.true(res.send.calledWith({ valid: true }))
})

test('validation failure', async (t) => {
  auth.validateUserToken.rejects()
  await validate({ body: { email: 'email', token: 'token', kind: auth.authKinds.USER } }, res)
  t.true(auth.validateUserToken.calledWith('email', 'token', auth.authKinds.USER))
  t.true(console.error.calledOnce)
  t.true(res.status.calledWith(500))
})
