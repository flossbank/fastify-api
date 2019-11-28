const test = require('ava')
const sinon = require('sinon')
const bcrypt = require('bcrypt')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const sanitize = require('../../../sanitize/advertiserInput')
const mockFastify = require('../../helpers/_mockFastify')
const create = require('../../../api/advertiser/create')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(bcrypt, 'hash').returns('hashedpassword')
})

test.beforeEach(async () => {
  const sanitized = await sanitize(mockData.advertisers[0])
  sanitized.password = bcrypt.hash(mockData.advertisers[0].password, 10)
  mockFastify.mongo.collection.returns({
    insertOne: sinon.stub().resolves({
      ops: [sanitized],
      insertedId: mockData.advertisers[0]._id
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

test('success', async (t) => {
  // Assert that the password in the request is not hashed
  t.true(mockData.advertisers[0].password !== 'hashedpassword')
  await create({ body: { advertiser: mockData.advertisers[0] } }, res, mockFastify)
  const encPass = bcrypt.hash(mockData.advertisers[0].password, 10)
  const expected = { ...sanitize(mockData.advertisers[0]), password: encPass }
  t.true(res.send.calledWith({ insertedId: mockData.advertisers[0]._id }))
  // Assert that what was called with res.send had a hashed password
  t.true(expected.password === 'hashedpassword')
  t.true(mockFastify.mongo.collection.calledWith('advertisers'))
  t.true(mockFastify.mongo.collection().insertOne.calledWith(expected))
})

test('reject with invalid params', async (t) => {
  await create({ body: { advertiser: { name: 'pete', email: 'pete@pete' } } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection.notCalled)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().insertOne.throws()
  try {
    await create({ body: { advertiser: mockData.advertisers[0] } }, res, mockFastify)
  } catch (_) {}
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
