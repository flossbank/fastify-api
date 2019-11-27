const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const sanitize = require('../../../sanitize/adOutput')
const mockFastify = require('../../helpers/_mockFastify')
const auth = require('../../../auth')
const get = require('../../../api/ad/get')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(() => {
  sinon.stub(auth, 'isRequestAllowed').returns(true)
  sinon.stub(auth, 'createAdSession').returns('ff')
  mockFastify.mongo.collection.returns({
    find: sinon.stub().returns({
      limit: sinon.stub().returns({
        toArray: sinon.stub().resolves(mockData.ads)
      })
    })
  })
})

test.afterEach(() => {
  console.error.reset()
  auth.isRequestAllowed.restore()
  auth.createAdSession.restore()
  mockFastify.mongo.collection.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('success', async (t) => {
  await get({ body: { packages: ['flossbank'], packageManager: 'npm' } }, res, mockFastify)
  t.true(res.send.calledWith({ ads: sanitize(mockData.ads), sessionId: 'ff' }))
  t.true(mockFastify.mongo.collection.calledWith('ads'))
  t.true(mockFastify.mongo.collection().find().limit.calledWith(12))
})

test('bad input | no body', async (t) => {
  await get({}, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('bad input | no packages', async (t) => {
  await get({ body: { packageManager: 'npm' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('bad input | no packageManager', async (t) => {
  await get({ body: { packages: [] } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('bad input | invalid packageManager', async (t) => {
  await get({ body: { packages: [], packageManager: 'abc' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('unauthorized', async (t) => {
  auth.isRequestAllowed.returns(false)
  await get({ body: { packages: [], packageManager: 'npm' } }, res, mockFastify)
  t.true(res.status.calledWith(401))
  t.true(res.send.called)
})

test('instance failure', async (t) => {
  mockFastify.mongo.collection.throws()
  await get({ body: { packages: [], packageManager: 'npm' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().find.throws()
  await get({ body: { packages: [], packageManager: 'npm' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
