const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const getRevenue = require('../../../api/maintainer/revenue')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(() => {
  mockFastify.mongo.collection.onFirstCall().returns({
    find: sinon.stub().returns({
      toArray: sinon.stub().resolves([mockData.maintainerPackageRels[0]])
    })
  }).onSecondCall().returns({
    findOne: sinon.stub().resolves(mockData.packages[0])
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

test('success get revenue for maintainer 1', async (t) => {
  await getRevenue({ query: { maintainerId: mockData.maintainers[0]._id } }, res, mockFastify)
  t.true(res.send.calledWith(90))
  t.true(mockFastify.mongo.collection.calledWith('packages'))
  t.true(mockFastify.mongo.collection.calledWith('maintainer_package_rel'))
})

test('success get revenue for maintainer 2', async (t) => {
  // Overwrite stub to return the second maintainers relationship
  mockFastify.mongo.collection.onFirstCall().returns({
    find: sinon.stub().returns({
      toArray: sinon.stub().resolves([mockData.maintainerPackageRels[1]])
    })
  })

  await getRevenue({ query: { maintainerId: mockData.maintainers[1]._id } }, res, mockFastify)
  t.true(res.send.calledWith(10))
  t.true(mockFastify.mongo.collection.calledWith('packages'))
  t.true(mockFastify.mongo.collection.calledWith('maintainer_package_rel'))
})

test('failure with 400 with no maintainerId', async (t) => {
  await getRevenue({ query: { maintainerId: null } }, res, mockFastify)
  t.true(res.send.called)
  t.true(res.status.calledWith(400))
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().find.throws()
  try {
    await getRevenue({ query: { maintainerId: mockData.maintainers[0]._id } }, res, mockFastify)
  } catch (_) {}
  t.true(res.send.called)
  t.true(res.status.calledWith(500))
  t.true(console.error.called)
})
