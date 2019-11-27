const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const getAll = require('../../../api/ad/get-all')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(() => {
  mockFastify.mongo.collection.returns({
    find: sinon.stub().returns({
      toArray: sinon.stub().resolves(mockData.ads.slice(0, 2))
    })
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

test('advertiser | success', async (t) => {
  await getAll({ query: { advertiserId: 2 } }, res, mockFastify)
  t.true(res.send.calledWith(mockData.ads.slice(0, 2)))
  t.true(mockFastify.mongo.collection.calledWith('ads'))
  t.true(mockFastify.mongo.collection().find.calledWith({
    advertiserId: 2
  }))
})

test('invalid args - no advertiserId', async (t) => {
  await getAll({ query: {} }, res, mockFastify)
  t.true(res.status.calledWith(400))
})

test('instance failure', async (t) => {
  mockFastify.mongo.collection.throws()
  await getAll({ query: { advertiserId: 2 } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
