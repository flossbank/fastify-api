const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const activate = require('../../../api/adCampaign/activate')

test.before(() => {
  sinon.stub(Date, 'now').returns(1234)
  sinon.stub(console, 'error')
})

test.beforeEach(async () => {
  mockFastify.mongoClient = {
    startSession: sinon.stub().returns({
      withTransaction: (cb) => cb(),
      endSession: sinon.stub()
    })
  }
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().resolves(mockData.adCampaigns[1]),
    find: sinon.stub().returns({
      toArray: sinon.stub().resolves(
        mockData.ads.filter(ad => mockData.adCampaigns[1].ads.includes(ad._id))
      )
    }),
    updateOne: sinon.stub().resolves({}),
    updateMany: sinon.stub().resolves({})
  })
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

test('success activating ad campaign', async (t) => {
  await activate({
    body: {
      adCampaignId: mockData.adCampaigns[1]._id,
      advertiserId: mockData.adCampaigns[1].advertiserId
    }
  }, res, mockFastify)
  t.deepEqual(res.send.lastCall.args, [{ success: true }])
  t.true(mockFastify.mongo.collection().updateOne.calledWith(
    { _id: 'test-ad-campaign-1' },
    { $set: { active: true } }
  ))
})

test('reject if not all child ads are approved', async (t) => {
  mockFastify.mongo.collection().find().toArray.resolves([{ approved: false }])
  await activate({
    body: {
      adCampaignId: mockData.adCampaigns[1]._id,
      advertiserId: mockData.adCampaigns[1].advertiserId
    }
  }, res, mockFastify)
  t.deepEqual(res.send.lastCall.args, [{
    success: false,
    message: 'All ads in a campaign must be approved before activating'
  }])
  t.true(mockFastify.mongo.collection().updateOne.notCalled)
})

test('reject with invalid params, no campaign Id', async (t) => {
  await activate({ body: { advertiserId: '1234' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection().updateOne.notCalled)
})

test('reject with invalid params, no advertiserId', async (t) => {
  await activate({ body: { adCampaignId: '1234' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection().updateOne.notCalled)
})

test('reject if ad campaign is owned by other advertiser', async (t) => {
  // advertiser id of 1234 is not what the mock findOne returns.
  await activate({ body: { advertiserId: '1234', adCampaignId: '1234' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection.calledWith('adCampaigns'))
  t.true(mockFastify.mongo.collection().findOne.calledWith({ _id: '1234' }))
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().findOne.throws()
  await activate({ body: { ...mockData.adCampaigns[1], adCampaignId: '1234' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})

test('transaction query failure', async (t) => {
  mockFastify.mongoClient.startSession.returns({
    withTransaction: sinon.stub().throws()
  })
  await activate({ body: { ...mockData.adCampaigns[1], adCampaignId: '1234' } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
