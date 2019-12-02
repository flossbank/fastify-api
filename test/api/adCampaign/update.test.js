const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const update = require('../../../api/adCampaign/update')

test.before(() => {
  sinon.stub(Date, 'now').returns(1234)
  sinon.stub(console, 'error')
})

test.beforeEach(async () => {
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().resolves(mockData.adCampaigns[0]),
    find: sinon.stub().resolves(mockData.ads),
    updateOne: sinon.stub().resolves({})
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

test('success updating ad campaign', async (t) => {
  await update({ body: { ...mockData.adCampaigns[0], adCampaignId: mockData.adCampaigns[0]._id, name: 'peters-ad' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection.calledWith('adCampaigns'))
  t.true(mockFastify.mongo.collection().updateOne.calledWith(
    { _id: 'test-ad-campaign-0' },
    {
      $set:
      {
        name: 'peters-ad',
        ads: mockData.adCampaigns[0].ads,
        maxSpend: mockData.adCampaigns[0].maxSpend,
        cpm: 100,
        startDate: 12345,
        endDate: 123456
      }
    }))
})

test('defaut creating ad campaign cpm to 100 if sent with below 100 cpm', async (t) => {
  await update({ body: { ...mockData.adCampaigns[0], adCampaignId: mockData.adCampaigns[0]._id, cpm: 60, name: 'new-name' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection.calledWith('adCampaigns'))
  t.true(mockFastify.mongo.collection().updateOne.calledWith(
    { _id: 'test-ad-campaign-0' },
    {
      $set:
      {
        name: 'new-name',
        ads: mockData.adCampaigns[0].ads,
        maxSpend: mockData.adCampaigns[0].maxSpend,
        cpm: 100,
        startDate: 12345,
        endDate: 123456
      }
    }))
})

test('creating ad campaign with above 100 cpm allowed', async (t) => {
  await update({ body: { ...mockData.adCampaigns[0], adCampaignId: mockData.adCampaigns[0]._id, cpm: 600, name: 'new-name-2' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection.calledWith('adCampaigns'))
  t.true(mockFastify.mongo.collection().updateOne.calledWith(
    { _id: 'test-ad-campaign-0' },
    {
      $set:
      {
        name: 'new-name-2',
        ads: mockData.adCampaigns[0].ads,
        maxSpend: mockData.adCampaigns[0].maxSpend,
        cpm: 600,
        startDate: 12345,
        endDate: 123456
      }
    }))
})

test('reject with invalid params, no campaign Id', async (t) => {
  await update({ body: { advertiserId: '1234', ads: ['1234'] } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection().updateOne.notCalled)
})

test('reject with invalid params, no advertiserId', async (t) => {
  await update({ body: { adCampaignId: '1234', ads: ['1234'], maxSpend: 100000, cpm: 200 } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection().updateOne.notCalled)
})

test('reject if ad campaign is owned by other advertiser', async (t) => {
  // advertiser id of 1234 is not what the mock findOne returns.
  await update({ body: { advertiserId: '1234', ads: ['1234'], adCampaignId: '1234', cpm: 200 } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(res.send.called)
  t.true(mockFastify.mongo.collection.calledWith('adCampaigns'))
  t.true(mockFastify.mongo.collection().findOne.calledWith({ _id: '1234' }))
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().findOne.throws()
  try {
    await update({ body: { ...mockData.adCampaigns[0], adCampaignId: '1234' } }, res, mockFastify)
  } catch (_) {}
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
