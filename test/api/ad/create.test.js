const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const sanitizeAd = require('../../../sanitize/adInput')
const create = require('../../../api/ad/create')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(() => {
  mockFastify.mongo.collection.returns({
    insertOne: sinon.stub().resolves(sanitizeAd(mockData.ads[0]))
  })
})

test.afterEach(() => {
  console.error.reset()
  mockFastify.mongo.collection.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('success', async (t) => {
  await create({ body: { ad: mockData.ads[0] } }, res, mockFastify)
  t.true(res.send.calledWith(sanitizeAd(mockData.ads[0])))
  t.true(mockFastify.mongo.collection.calledWith('ads'))
  t.true(mockFastify.mongo.collection().insertOne.calledWith(sanitizeAd(mockData.ads[0])))
})

test('invalid input, no name', async (t) => {
  await create({ body: { ad: { advertiserId: '1' } } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection.notCalled)
})

test('invalid input, no content', async (t) => {
  await create({ body: { ad: { advertiserId: '1', name: 'adname', content: { title: 'hello' } } } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection.notCalled)
})

test('instance failure', async (t) => {
  mockFastify.mongo.collection.throws()
  await create({ body: { ad: mockData.ads[0] } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().insertOne.throws()
  await create({ body: { ad: mockData.ads[0] } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
