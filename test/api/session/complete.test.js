const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const auth = require('../../../auth')
const sqs = require('../../../sqs')
const complete = require('../../../api/session/complete')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(sqs, 'sendMessage').resolves()
})

test.beforeEach(() => {
  sinon.stub(auth, 'isRequestAllowed').returns(true)
})

test.afterEach(() => {
  console.error.reset()
  auth.isRequestAllowed.restore()
})

test.after(() => {
  console.error.restore()
  sqs.sendMessage.restore()
})

test('success', async (t) => {
  await complete({ body: { seen: [], sessionId: '123' } }, res)
  t.true(sqs.sendMessage.called)
  t.true(res.status.calledWith(200))
  t.true(res.send.called)
})

test('bad input | no body', async (t) => {
  await complete({}, res)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('bad input | no seen', async (t) => {
  await complete({ body: { sessionId: '123' } }, res)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('bad input | no sessionId', async (t) => {
  await complete({ body: { seen: [] } }, res)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('unauthorized', async (t) => {
  auth.isRequestAllowed.returns(false)
  await complete(null, res)
  t.true(res.status.calledWith(401))
  t.true(res.send.called)
})

test('failure', async (t) => {
  sqs.sendMessage.rejects()
  await complete({ body: { seen: [], sessionId: '123' } }, res)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
})
