const test = require('ava')
const sinon = require('sinon')
const res = require('../../helpers/_response')
const mockData = require('../../helpers/_mockData')
const mockFastify = require('../../helpers/_mockFastify')
const update = require('../../../api/ad/update')

test.before(() => {
  sinon.stub(console, 'error')
})

const updatedAd1 = {
  ...mockData.ads[0],
  content: {
    title: 'lord of the rings',
    url: 'hello.com',
    body: 'Golem'
  },
  adCampaigns: ['1234'],
  name: 'old-name'
}

test.beforeEach(() => {
  mockFastify.mongo.collection.returns({
    updateOne: sinon.stub().resolves(updatedAd1)
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

test('success updating ad', async (t) => {
  const sanitizedAd = {
    name: updatedAd1.name,
    content: {
      body: updatedAd1.content.body,
      url: updatedAd1.content.url,
      title: updatedAd1.content.title
    }
  }
  await update({ body: { ad: updatedAd1 } }, res, mockFastify)
  t.true(res.send.calledWith({ success: true }))
  t.true(mockFastify.mongo.collection.calledWith('ads'))
  t.true(mockFastify.mongo.collection().updateOne.calledWith({ _id: updatedAd1._id }, { $set: sanitizedAd }))
})

test('invalid input, no name', async (t) => {
  await update({ body: { ad: { advertiserId: '1' } } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(mockFastify.mongo.collection.notCalled)
})

test('invalid input, no content for update', async (t) => {
  await update({ body: { ad: { advertiserId: '1', name: 'valid-name', content: { title: 'hello' } } } }, res, mockFastify)
  t.true(res.status.calledWith(400))
  t.true(mockFastify.mongo.collection.notCalled)
})

test('instance failure', async (t) => {
  mockFastify.mongo.collection.throws()
  await update({ body: { ad: mockData.ads[0] } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(console.error.called)
})

test('query failure', async (t) => {
  mockFastify.mongo.collection().updateOne.throws()
  await update({ body: { ad: mockData.ads[0] } }, res, mockFastify)
  t.true(res.status.calledWith(500))
  t.true(res.send.called)
  t.true(console.error.called)
})
