const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const getPackages = require('../../../api/advertiser/get')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(() => {
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().returns(mockData.advertisers[0])
  })
})

test.afterEach(() => {
  console.error.reset()
  mockFastify.mongo.collection.reset()
  mockFastify.mongoObjectID.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('success get advertiser', async (t) => {
  await getPackages({ query: { advertiserId: mockData.advertisers[0]._id } }, res, mockFastify)
  t.true(res.send.calledWith(mockData.advertisers[0]))
  t.true(mockFastify.mongo.collection.calledWith('advertisers'))
  t.true(mockFastify.mongo.collection().findOne.calledWith({ _id: mockData.advertisers[0]._id }))
})

test('failure with 400 with no advertiserId', async (t) => {
  await getPackages({ query: { advertiserId: null } }, res, mockFastify)
  t.true(res.send.called)
  t.true(res.status.calledWith(400))
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().findOne.throws()
  await getPackages({ query: { advertiserId: mockData.advertisers[0]._id } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
