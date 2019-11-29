const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const create = require('../../../api/adCampaign/create')

test.before(() => {
  sinon.stub(Date, 'now').returns(1234)
  sinon.stub(console, 'error')
})

test.beforeEach(async () => {
  mockFastify.mongo.collection.returns({
    findOne: sinon.stub().resolves(mockData.advertisers[0]),
    insertOne: sinon.stub().resolves({ insertedId: mockData.adCampaigns[0]._id })
  })
})

test.afterEach(() => {
  console.error.reset()
  mockFastify.mongo.collection.reset()
  mockFastify.mongoObjectID.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('success creating ad campaign', async (t) => {
  await create({ body: { ...mockData.adCampaigns[0] } }, res, mockFastify)
  t.true(res.send.calledWith({ insertedId: mockData.adCampaigns[0]._id }))
  t.true(mockFastify.mongo.collection.calledWith('advertisers'))
  t.true(mockFastify.mongo.collection.calledWith('adCampaigns'))
  t.true(mockFastify.mongo.collection().insertOne.calledWith({
    name: mockData.adCampaigns[0].name,
    advertiserId: mockData.adCampaigns[0].advertiserId,
    ads: mockData.adCampaigns[0].ads,
    maxSpend: mockData.adCampaigns[0].maxSpend,
    cpm: 100,
    createDate: 1234,
    active: false,
    spend: 0
  }))
})

test('defaut creating ad campaign cpm to 100 if sent with below 100 cpm', async (t) => {
  await create({ body: { ...mockData.adCampaigns[0], cpm: 80 } }, res, mockFastify)
  t.true(res.send.calledWith({ insertedId: mockData.adCampaigns[0]._id }))
  t.true(mockFastify.mongo.collection.calledWith('advertisers'))
  t.true(mockFastify.mongo.collection.calledWith('adCampaigns'))
  t.true(mockFastify.mongo.collection().insertOne.calledWith({
    name: mockData.adCampaigns[0].name,
    advertiserId: mockData.adCampaigns[0].advertiserId,
    ads: mockData.adCampaigns[0].ads,
    maxSpend: mockData.adCampaigns[0].maxSpend,
    cpm: 100,
    createDate: 1234,
    active: false,
    spend: 0
  }))
})

test('allow creating ad campaign cpm above 100', async (t) => {
  await create({ body: { ...mockData.adCampaigns[0], cpm: 600 } }, res, mockFastify)
  t.true(res.send.calledWith({ insertedId: mockData.adCampaigns[0]._id }))
  t.true(mockFastify.mongo.collection.calledWith('advertisers'))
  t.true(mockFastify.mongo.collection.calledWith('adCampaigns'))
  t.true(mockFastify.mongo.collection().insertOne.calledWith({
    name: mockData.adCampaigns[0].name,
    advertiserId: mockData.adCampaigns[0].advertiserId,
    ads: mockData.adCampaigns[0].ads,
    maxSpend: mockData.adCampaigns[0].maxSpend,
    cpm: 600,
    createDate: 1234,
    active: false,
    spend: 0
  }))
})

test('reject with invalid params, no cpm', async (t) => {
  await create({ body: { advertiserId: '1234', ads: ['1234'], maxSpend: 100000, name: 'second-ad' } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(mockFastify.mongo.collection.notCalled)
})

test('reject with invalid params, no name', async (t) => {
  await create({ body: { advertiserId: '1234', ads: ['1234'], maxSpend: 100000, cpm: 200 } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(mockFastify.mongo.collection.notCalled)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().insertOne.throws()
  try {
    await create({ body: { ...mockData.adCampaigns[0] } }, res, mockFastify)
  } catch (_) {}
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
