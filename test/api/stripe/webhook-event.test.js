const test = require('ava')
const sinon = require('sinon')
const testData = require('./_test_event')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  sinon.stub(Date, 'now').returns(1592794872)
  await before(t, async ({ db }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId1, customerId: 'cus_HUsI9NcGHli9mq' })

    const { id: orgId1 } = await db.organization.create({ name: 'Papa Johns', host: 'GitHub', userId: t.context.userId1, email: 'honey@etsy.com' })
    t.context.orgId1 = orgId1.toHexString()
    await db.organization.updateCustomerId({ orgId: t.context.orgId1, customerId: 'cus_HUssssssssssss' })
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

test('POST `/stripe/webhook/event` 200 success | user', async (t) => {
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
    userId: t.context.userId1,
    description: '(created by Stripe CLI)',
    paymentSuccess: true,
    timestamp: 1592794872
  }
  t.deepEqual(t.context.sqs.sendDistributeUserDonationMessage.lastCall.args, [expectedPayload])
})

test('POST `/stripe/webhook/event` 200 success | org', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: testData.org_succeeded.body,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': testData.org_succeeded.signature
    }
  })
  t.deepEqual(res.statusCode, 200)
  const expectedPayload = {
    amount: 2000,
    organizationId: t.context.orgId1,
    description: '(created by Stripe CLI)',
    paymentSuccess: true,
    timestamp: 1592794872
  }
  t.deepEqual(t.context.sqs.sendDistributeOrgDonationMessage.lastCall.args, [expectedPayload])
})

test('POST `/stripe/webhook/event` 500 failure | unknown customer', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: testData.unknown_cust_succeeded.body,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': testData.unknown_cust_succeeded.signature
    }
  })
  t.deepEqual(res.statusCode, 500)
})

test('POST `/stripe/webhook/event` 500 failure', async (t) => {
  t.context.sqs.sendDistributeOrgDonationMessage.rejects()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/stripe/webhook/event',
    payload: testData.org_succeeded.body,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': testData.org_succeeded.signature
    }
  })
  t.deepEqual(res.statusCode, 500)
})
