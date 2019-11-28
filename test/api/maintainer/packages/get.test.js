const test = require('ava')
const sinon = require('sinon')
const res = require('../../../helpers/_response')
const mockData = require('../../../helpers/_mockData')
const mockFastify = require('../../../helpers/_mockFastify')
const getPackages = require('../../../../api/maintainer/packages/get')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(() => {
  mockFastify.mongo.collection.returns({
    find: sinon.stub().returns({
      toArray: sinon.stub().resolves([mockData.packages[0]])
    })
  })
})

test.afterEach(() => {
  console.error.reset()
  mockFastify.mongoObjectID.reset()
  mockFastify.mongo.collection.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('success get packages', async (t) => {
  await getPackages({ query: { maintainerId: mockData.maintainers[0]._id } }, res, mockFastify)
  t.true(res.send.calledWith([mockData.packages[0]]))
  t.true(mockFastify.mongo.collection.calledWith('packages'))
  t.true(mockFastify.mongo.collection().find.calledWith({ owner: mockData.maintainers[0]._id }))
})

test('failure with 400 with no maintainerId', async (t) => {
  await getPackages({ query: { maintainerId: null } }, res, mockFastify)
  t.true(res.send.called)
  t.true(res.status.calledWith(400))
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().find.throws()
  try {
    await getPackages({ query: { maintainerId: mockData.maintainers[0]._id } }, res, mockFastify)
  } catch (_) {}
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
