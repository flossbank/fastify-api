const test = require('ava')
const sinon = require('sinon')
const bcrypt = require('bcrypt')
const auth = require('../../../auth')
const res = require('../../helpers/_response')
const mockFastify = require('../../helpers/_mockFastify')
const create = require('../../../api/maintainer/register')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(bcrypt, 'hash').returns('hashedpassword')
  sinon.stub(auth, 'sendUserToken').resolves({ success: true })
})

test.beforeEach(async () => {
  const maintainer = {
    email: 'peter@laura.com',
    password: 'hashedpassword',
    verified: false
  }
  mockFastify.mongo.collection.returns({
    insertOne: sinon.stub().returns(maintainer)
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

test('success', async (t) => {
  const inputMaintainer = {
    name: 'peter pajamas',
    email: 'peter@laura.com',
    password: 'unhashedpass',
    verified: false
  }
  // Assert that the password in the request is not hashed
  t.true(inputMaintainer.password !== 'hashedpassword')
  await create({ body: { ...inputMaintainer } }, res, mockFastify)
  const encPass = bcrypt.hash(inputMaintainer.password, 10)
  const expected = { ...inputMaintainer, password: encPass }
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection.calledWith('maintainers'))
  t.true(mockFastify.mongo.collection().insertOne.calledWith(expected))
})

test('reject with invalid params', async (t) => {
  await create({ body: { name: 'pete', email: 'pete@pete' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection.notCalled)
})

test('failure sending auth email', async (t) => {
  auth.sendUserToken.rejects()
  await create({ body: { name: 'pete', email: 'pete@pete', password: 'pass' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().insertOne.throws()
  await create({ body: { name: 'pete', email: 'pete@pete', password: 'pass' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
