const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async () => {
    sinon.stub(Date, 'now').returns(1234)

    t.context.validEventPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          amount: 10000,
          customer: {
            id: 'poopy'
          },
          description: 'poopy make payment 10 dollars'
        }
      }
    }
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.stripe.constructWebhookEvent.resolves(t.context.validEventPayload)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

// TODO: THIS SHOULD PASS DONT LAUNCH UNTIL THEN
// https://github.com/fastify/fastify/issues/707
// test('POST `/stripe/webhook/event` 403 unauthorized no stripe signature in header', async (t) => {
//   t.context.stripe.constructWebhookEvent.throws()
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/stripe/webhook/event',
//     payload: t.context.validEventPayload,
//     headers: { }
//   })
//   t.deepEqual(res.statusCode, 403)
// })

// TODO: THIS SHOULD PASS DONT LAUNCH UNTIL THEN
// https://github.com/fastify/fastify/issues/707
// test('POST `/stripe/webhook/event` 403 unauthorized stripe signature verification failed', async (t) => {
//   t.context.stripe.constructWebhookEvent.throws()
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/stripe/webhook/event',
//     payload: t.context.validEventPayload,
//     headers: { 'stripe-signature': 'valid-signature' }
//   })
//   t.deepEqual(res.statusCode, 403)
// })

test('POST `/stripe/webhook/event` 200 even unhandled event type', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: {
      type: 'unhandled type',
      data: {
        object: {
          amount: 10000,
          customer: {
            id: 'poopy'
          },
          description: 'poopy make payment 10 dollars'
        }
      }
    },
    headers: { 'stripe-signature': 'valid-signature' }
  })
  t.deepEqual(res.statusCode, 200)
})

test('POST `/stripe/webhook/event` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: t.context.validEventPayload,
    headers: { 'stripe-signature': 'valid-signature' }
  })
  t.deepEqual(res.statusCode, 200)
  const expectedPayload = {
    customerId: t.context.validEventPayload.data.object.customer.id,
    amount: t.context.validEventPayload.data.object.amount,
    description: t.context.validEventPayload.data.object.description,
    timestamp: 1234,
    paymentSuccess: true
  }
  t.true(t.context.sqs.sendDistributeDonationMessage.calledWith(expectedPayload))
})

test('POST `/stripe/webhook/event` 500 server error', async (t) => {
  t.context.sqs.sendDistributeDonationMessage.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: t.context.validEventPayload,
    headers: { 'stripe-signature': 'valid-signature' }
  })
  t.deepEqual(res.statusCode, 500)
})
