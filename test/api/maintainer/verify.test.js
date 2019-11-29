const test = require('ava')
const sinon = require('sinon')
const auth = require('../../../auth')
const res = require('../../helpers/_response')
const mockFastify = require('../../helpers/_mockFastify')
const verify = require('../../../api/maintainer/verify')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(auth, 'validateUserToken').resolves(true)
})

test.beforeEach(async () => {
  mockFastify.mongo.collection.returns({
    updateOne: sinon.stub().returns(true)
  })
})

test.afterEach(() => {
  console.error.reset()
  mockFastify.mongoObjectID.reset()
  mockFastify.mongo.collection.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
  auth.validateUserToken.reset()
})

test.after(() => {
  console.error.restore()
})

test('success verifying', async (t) => {
  await verify({ query: { email: 'pete@pete.com', token: 'fake-token' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection().updateOne.calledWith({ email: 'pete@pete.com' },
    { $set: { verified: true } }))
  t.true(auth.validateUserToken.calledWith('pete@pete.com', 'fake-token', auth.authKinds.MAINTAINER))
})

test('reject with invalid params', async (t) => {
  await verify({ query: { email: 'pete@pete' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(auth.validateUserToken.notCalled)
})

test('failure validating user token', async (t) => {
  auth.validateUserToken.rejects()
  await verify({ query: { email: 'pete@pete.com', token: 'fake-token' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
})

test('query failure', async (t) => {
  auth.validateUserToken.resolves(true)
  mockFastify.mongo.collection().updateOne.throws()
  await verify({ query: { email: 'pete@pete.com', token: 'fake-token' } }, res, mockFastify)
  t.true(res.send.called)
  t.true(console.error.called)
  t.true(res.status.calledWith(500))
})
