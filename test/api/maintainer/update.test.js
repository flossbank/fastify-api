const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const update = require('../../../api/maintainer/update')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(async () => {
  const sanitizedModified = { ...mockData.maintainers[0], payoutEmail: 'newPayoutEmail' }
  delete sanitizedModified.password
  mockFastify.mongo.collection.returns({
    updateOne: sinon.stub().resolves(sanitizedModified)
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

test('success updating maintainer payoutEmail', async (t) => {
  await update({ body: { maintainer: { ...mockData.maintainers[0], payoutEmail: 'newPayoutEmail' } } }, res, mockFastify)
  const expected = { payoutEmail: 'newPayoutEmail' }
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection.calledWith('maintainers'))
  t.true(mockFastify.mongo.collection().updateOne.calledWith(
    { _id: mockData.maintainers[0]._id },
    { $set: expected }
  ))
})

test('reject with invalid params', async (t) => {
  // No ID passed in, so can't update
  await update({ body: { maintainer: { name: 'pete', email: 'pete@pete' } } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection.notCalled)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().updateOne.throws()
  await update({ body: { maintainer: mockData.maintainers[0] } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
