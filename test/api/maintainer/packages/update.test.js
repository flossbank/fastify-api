const test = require('ava')
const sinon = require('sinon')
const res = require('../../../helpers/_response')
const mockData = require('../../../helpers/_mockData')
const mockFastify = require('../../../helpers/_mockFastify')
const updatePackage = require('../../../../api/maintainer/packages/update')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(() => {
  mockFastify.mongo.collection.returns({
    updateOne: sinon.stub().returns({
      ...mockData.packages[1],
      maintainers: ['test-maintainer-1', 'test-maintainer-2']
    }),
    findOne: sinon.stub()
      .onFirstCall().returns({
        _id: 'test-package-1',
        name: 'js-deep-equals',
        dividend: 100,
        dividendAge: 0,
        totalRevenue: 100,
        maintainers: ['test-maintainer-1'],
        owner: 'test-maintainer-1'
      })
      .onSecondCall().returns({
        _id: 'test-rel-1',
        maintainerId: 'test-maintainer-1',
        packageId: 'test-package-1',
        revenuePercent: 10
      })
      .onThirdCall().returns(undefined),
    insertOne: sinon.stub().returns(mockData.maintainerPackageRels[2])
  })

  mockFastify.mongoClient = {
    startSession: sinon.stub().returns({
      withTransaction: (cb) => cb()
    })
  }
})

test.afterEach(() => {
  console.error.reset()
  mockFastify.mongoClient.startSession.reset()
  mockFastify.mongoObjectID.reset()
  mockFastify.mongo.collection.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('success inserting packages', async (t) => {
  const testUpdatedPackage = {
    ...mockData.packages[1],
    maintainers: ['test-maintainer-1', 'test-maintainer-2']
  }
  await updatePackage({ body: { package: testUpdatedPackage, maintainerId: 'test-maintainer-1' } }, res, mockFastify)
  t.true(mockFastify.mongo.collection.calledWith('packages'))
  t.true(mockFastify.mongo.collection.calledWith('maintainer_package_rel'))
  // Make sure find package rels is called for both maintainers
  t.true(mockFastify.mongo.collection().findOne.calledWith({
    maintainerId: 'test-maintainer-1',
    packageId: 'test-package-1'
  }))
  t.true(mockFastify.mongo.collection().findOne.calledWith({
    maintainerId: 'test-maintainer-2',
    packageId: 'test-package-1'
  }))
  // Make sure the only time insert one is called is with the new maintainer
  t.true(mockFastify.mongo.collection().insertOne.calledWith({
    maintainerId: 'test-maintainer-2',
    packageId: 'test-package-1',
    revenuePercent: 0
  }))
  t.true(res.send.calledWith({ success: true }))
})

test('returns 500 if non owner tries updating', async (t) => {
  const testUpdatedPackage = {
    ...mockData.packages[0],
    maintainers: ['test-maintainer-1', 'test-maintainer-2']
  }
  await updatePackage({ body: { package: testUpdatedPackage, maintainerId: 'test-maintainer-2' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().updateOne.throws()
  const testUpdatedPackage = {
    ...mockData.packages[0],
    maintainers: ['test-maintainer-1', 'test-maintainer-2']
  }
  await updatePackage({ body: { package: testUpdatedPackage, maintainerId: 'test-maintainer-1' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
