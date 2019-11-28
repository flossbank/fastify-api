const test = require('ava')
const sinon = require('sinon')
const auth = require('../../../auth')
const res = require('../../helpers/_response')
const send = require('../../../api/auth/send')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(auth, 'sendUserToken')
})

test.afterEach(() => {
  console.error.reset()
  res.status.reset()
})

test.after(() => {
  console.error.restore()
  auth.sendUserToken.restore()
})

test('missing params', async (t) => {
  await send({}, res)
  t.true(res.status.calledWith(400))
  res.status.reset()

  await send({ body: {} }, res)
  t.true(res.status.calledWith(400))
  res.status.reset()
})

test('success', async (t) => {
  await send({ body: { email: 'email' } }, res)
  t.true(auth.sendUserToken.calledWith('email', auth.authKinds.USER))
})

test('send failure', async (t) => {
  auth.sendUserToken.rejects()
  await send({ body: { email: 'email' } }, res)
  t.true(auth.sendUserToken.calledWith('email', auth.authKinds.USER))
  t.true(console.error.calledOnce)
  t.true(res.status.calledWith(500))
})
