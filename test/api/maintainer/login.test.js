const test = require('ava')
const sinon = require('sinon')
const bcrypt = require('bcrypt')
const auth = require('../../../auth')
const res = require('../../helpers/_response')
const mockFastify = require('../../helpers/_mockFastify')
const login = require('../../../api/maintainer/login')
const { maintainerSessionKey } = require('../../../helpers/constants')

test.before(() => {
  sinon.stub(console, 'error')
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

test('reject with invalid params', async (t) => {
  await login({ body: { email: 'pete' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
})

test('reject logging in because not verified user', async (t) => {
  const maintainer = {
    email: 'peter@laura.com',
    password: 'hashedpassword',
    verified: false
  }
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().returns(maintainer)
  })
  await login({ body: { email: 'peter@laura.com', password: 'unhashed' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: false, message: 'Email address has not been verified' }))
  t.true(mockFastify.mongo.collection.calledWith('maintainers'))
  t.true(mockFastify.mongo.collection().findOne.calledWith({ email: 'peter@laura.com' }))
  mockFastify.mongo.collection.reset()
})

test('reject logging in because no account for email', async (t) => {
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().returns(undefined)
  })
  await login({ body: { email: 'peter@laura.com', password: 'unhashed' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: false, message: 'Login failed; Invalid user ID or password' }))
  t.true(mockFastify.mongo.collection.calledWith('maintainers'))
  t.true(mockFastify.mongo.collection().findOne.calledWith({ email: 'peter@laura.com' }))
  mockFastify.mongo.collection.reset()
})

test('reject with invalid password', async (t) => {
  sinon.stub(bcrypt, 'compare').returns(false)
  const maintainer = {
    email: 'peter@laura.com',
    password: 'diffpass',
    verified: true
  }
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().returns(maintainer)
  })
  await login({ body: { email: 'pete@pete.com', password: 'pass' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: false, message: 'Login failed; Invalid user ID or password' }))
  t.true(mockFastify.mongo.collection.calledWith('maintainers'))
  t.true(mockFastify.mongo.collection().findOne.calledWith({ email: 'pete@pete.com' }))
  mockFastify.mongo.collection.reset()
  bcrypt.compare.restore()
})

test('succesful login', async (t) => {
  sinon.stub(auth, 'createMaintainerSession').resolves('1234')
  sinon.stub(bcrypt, 'compare').returns(true)
  const maintainer = {
    email: 'peter@laura.com',
    password: 'hashedpassword',
    verified: true
  }
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().returns(maintainer)
  })
  await login({ body: { email: 'pete@pete.com', password: 'pass' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection.calledWith('maintainers'))
  t.true(mockFastify.mongo.collection().findOne.calledWith({ email: 'pete@pete.com' }))
  t.true(res.setCookie.calledWith(maintainerSessionKey, '1234'))
  mockFastify.mongo.collection.reset()
  auth.createMaintainerSession.restore()
})

test('query failure', async (t) => {
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().throws()
  })
  await login({ body: { email: 'pete@pete', password: 'pass' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
  mockFastify.mongo.collection.reset()
})
