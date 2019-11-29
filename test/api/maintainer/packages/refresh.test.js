const test = require('ava')
const sinon = require('sinon')
const getOwnedPackagesModule = require('../../../../helpers/getOwnedPackagesWrapper')
const res = require('../../../helpers/_response')
const mockData = require('../../../helpers/_mockData')
const mockFastify = require('../../../helpers/_mockFastify')
const refreshPackages = require('../../../../api/maintainer/packages/refresh')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(() => {
  mockFastify.mongoClient = {
    startSession: sinon.stub().returns({
      withTransaction: (cb) => cb()
    })
  }
})

test.afterEach(() => {
  console.error.reset()
  mockFastify.mongoClient.startSession.reset()
  mockFastify.mongo.collection.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('should fail auth if no maintainer id passed in', async (t) => {
  await refreshPackages({ body: { maintainerId: undefined } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('should fail auth if no package manager passed in', async (t) => {
  await refreshPackages({ body: { maintainerId: 'valid-maintainer' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('should fail with invalid package manager', async (t) => {
  await refreshPackages({
    body: {
      maintainerId: 'valid-maintainer',
      packageManager: 'invalid-pkg-manager',
      token: 'valid-token'
    }
  }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('should return invalid params when no maintainer found', async (t) => {
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().returns(null)
  })
  await refreshPackages({ body: { maintainerId: 'valid-id', packageManager: 'npm' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: false, message: 'invalid params' }))
  mockFastify.mongo.collection.reset()
})

test('should return invalid token when no token found for maintainer', async (t) => {
  sinon.stub(getOwnedPackagesModule, 'getOwnedPackages').resolves(['js-deep-equals'])
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().onFirstCall().returns({
      _id: 'valid-maintainer',
      npmToken: undefined
    })
  })
  await refreshPackages({ body: { maintainerId: 'valid-maintainer', packageManager: 'npm' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: false, message: 'Invalid token' }))
  mockFastify.mongo.collection.reset()
  getOwnedPackagesModule.getOwnedPackages.restore()
})

test('should insert all packages and rels for packages', async (t) => {
  sinon.stub(getOwnedPackagesModule, 'getOwnedPackages').resolves(['js-deep-equals'])
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().onFirstCall().returns({
      _id: 'valid-maintainer',
      npmToken: 'a-valid-token'
    }).onSecondCall().returns(undefined),
    insertMany: sinon.stub().returns({
      toArray: sinon.stub().onFirstCall().returns([mockData.packages[0]]).onSecondCall().returns([])
    }),
    find: sinon.stub().returns({
      toArray: sinon.stub().returns([])
    })
  })
  await refreshPackages({ body: { maintainerId: 'valid-maintainer', packageManager: 'npm' } }, res, mockFastify)
  t.true(res.send.calledWith([mockData.packages[0]]))
  mockFastify.mongo.collection.reset()
  getOwnedPackagesModule.getOwnedPackages.restore()
})

test('should remove owner of old package no longer owned', async (t) => {
  sinon.stub(getOwnedPackagesModule, 'getOwnedPackages').resolves(['js-deep-equals'])
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().onFirstCall().returns({
      _id: 'valid-maintainer',
      npmToken: 'a-valid-token'
    }).onSecondCall().returns(undefined),
    insertMany: sinon.stub().returns({
      toArray: sinon.stub().onFirstCall().returns([mockData.packages[0]]).onSecondCall().returns([])
    }),
    updateOne: sinon.stub().returns({
      _id: 'old_package_no_longer_owned-maintainer',
      owner: undefined
    }),
    find: sinon.stub().returns({
      toArray: sinon.stub().returns([{
        _id: 'old_package_no_longer_owned',
        owner: 'old_owner'
      }])
    })
  })
  await refreshPackages({ body: { maintainerId: 'valid-maintainer', packageManager: 'npm' } }, res, mockFastify)
  t.true(res.send.calledWith([mockData.packages[0]]))
  t.true(mockFastify.mongo.collection().updateOne.calledWith({
    _id: 'old_package_no_longer_owned'
  }, { $set: { owner: undefined } }))
  mockFastify.mongo.collection.reset()
  getOwnedPackagesModule.getOwnedPackages.restore()
})

test('should update all owned packages with new owner', async (t) => {
  sinon.stub(getOwnedPackagesModule, 'getOwnedPackages').resolves(['js-deep-equals', 'not-owned-package'])
  // On the second toArray call, is when searching for a package, so return empty array.
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().onFirstCall().returns({
      _id: 'valid-maintainer',
      npmToken: 'a-valid-token'
    }).onSecondCall().returns({ ...mockData.packages[1], owner: 'not-new-owner' })
      .onThirdCall().returns(undefined),
    updateOne: sinon.stub().returns(mockData.packages[0]),
    insertMany: sinon.stub().returns({
      toArray: sinon.stub().onFirstCall().returns([mockData.packages[0]]).onSecondCall().returns([])
    }),
    insertOne: sinon.stub().returns({}),
    find: sinon.stub().returns({
      toArray: sinon.stub().returns([])
    })
  })
  await refreshPackages({ body: { maintainerId: 'valid-maintainer', packageManager: 'npm' } }, res, mockFastify)
  t.true(res.send.calledWith([mockData.packages[0]]))
  t.true(mockFastify.mongo.collection().updateOne.calledWith({
    _id: mockData.packages[1]._id
  }, { $set: { owner: 'valid-maintainer', maintainers: ['test-maintainer-1', 'test-maintainer-0', 'valid-maintainer'] } }))
  mockFastify.mongo.collection.reset()
  getOwnedPackagesModule.getOwnedPackages.restore()
})

test('should insert no packages if no new packages', async (t) => {
  sinon.stub(getOwnedPackagesModule, 'getOwnedPackages').resolves(['js-deep-equals'])
  // On the second toArray call, is when searching for a package, so return empty array.
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().onFirstCall().returns({
      _id: 'valid-maintainer',
      npmToken: 'a-valid-token'
    }).onSecondCall().returns({ ...mockData.packages[0], owner: 'valid-maintainer' }),
    find: sinon.stub().returns({
      toArray: sinon.stub().returns([])
    })
  })
  await refreshPackages({ body: { maintainerId: 'valid-maintainer', packageManager: 'npm' } }, res, mockFastify)
  t.true(res.send.calledWith([]))
  mockFastify.mongo.collection.reset()
  getOwnedPackagesModule.getOwnedPackages.restore()
})

test('should insert only new packages', async (t) => {
  sinon.stub(getOwnedPackagesModule, 'getOwnedPackages').resolves(['js-deep-equals', 'peter'])
  // On the second toArray call, is when searching for a package, so return empty array.
  mockFastify.mongo.collection.returns({
    find: sinon.stub().returns({
      toArray: sinon.stub().returns([])
    }),
    findOne: sinon.stub().onFirstCall().returns({
      _id: 'valid-maintainer',
      npmToken: 'a-valid-token'
    }).onSecondCall().returns({ ...mockData.packages[0], owner: 'valid-maintainer' }).onThirdCall().returns(undefined),
    insertMany: sinon.stub().returns({
      toArray: sinon.stub().onFirstCall().returns([mockData.packages[0]]).onSecondCall().returns([])
    })
  })
  await refreshPackages({ body: { maintainerId: 'valid-maintainer', packageManager: 'npm' } }, res, mockFastify)
  // Even though two packages passed in, only insert one
  t.true(res.send.calledWith([mockData.packages[0]]))
  mockFastify.mongo.collection.reset()
  getOwnedPackagesModule.getOwnedPackages.restore()
})

test('query failure', async (t) => {
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().throws()
  })
  try {
    await refreshPackages({ body: { maintainerId: 'valid-maintainer', packageManager: 'npm' } }, res, mockFastify)
  } catch (_) {}
  t.true(res.send.called)
  t.true(res.status.calledWith(500))
  t.true(console.error.called)
})
