const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const sanitize = require('../../../sanitize/advertiserInput')
const mockFastify = require('../../helpers/_mockFastify')
const update = require('../../../api/advertiser/update')

test.before(() => {
  sinon.stub(console, 'error')
})

test.beforeEach(async () => {
  const sanitizedModified = sanitize({ ...mockData.advertisers[0], name: 'newPeter' })
  delete sanitizedModified.password
  mockFastify.mongo.collection.returns({
    updateOne: sinon.stub().resolves(sanitizedModified)
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

test('success updating adCampaigns even when full advertiser is passed', async (t) => {
  await update({ body: { advertiser: { ...mockData.advertisers[0], adCampaigns: ['newcampaign'] } } }, res, mockFastify)
  const expected = {
    billingInfo: mockData.advertisers[0].billingInfo,
    organization: mockData.advertisers[0].organization,
    adCampaigns: ['newcampaign']
  }
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection.calledWith('advertisers'))
  t.true(mockFastify.mongo.collection().updateOne.calledWith(
    { _id: mockData.advertisers[0]._id },
    { $set: expected }
  ))
})

test('reject with invalid params', async (t) => {
  // No ID passed in, so can't update
  await update({ body: { advertiser: { name: 'pete', email: 'pete@pete' } } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection.notCalled)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().updateOne.throws()
  await update({ body: { advertiser: mockData.advertisers[0] } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
