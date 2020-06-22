const test = require('ava')
const sinon = require('sinon')
const testData = require('./_test_event')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async () => {
    sinon.stub(Date, 'now').returns(1592794872)
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
  Date.now.restore()
})

test('POST `/stripe/webhook/event` 403 unauthorized no stripe signature in header', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: testData.succeeded.body,
    headers: {
      'content-type': 'application/json'
    }
  })
  t.deepEqual(res.statusCode, 403)
})

test('POST `/stripe/webhook/event` 200 even unhandled event type', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: testData.created.body,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': testData.created.signature
    }
  })
  t.deepEqual(res.statusCode, 200)
})

test('POST `/stripe/webhook/event` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: testData.succeeded.body,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': testData.succeeded.signature
    }
  })
  t.deepEqual(res.statusCode, 200)
  const expectedPayload = {
    amount: 2000,
    customerId: undefined,
    description: '(created by Stripe CLI)',
    paymentSuccess: true,
    timestamp: 1592794872
  }
  t.deepEqual(t.context.sqs.sendDistributeDonationMessage.lastCall.args, [expectedPayload])
})

test('POST `/stripe/webhook/event` 500 server error', async (t) => {
  t.context.sqs.sendDistributeDonationMessage = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: testData.succeeded.body,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': testData.succeeded.signature
    }
  })
  t.deepEqual(res.statusCode, 500)
})
