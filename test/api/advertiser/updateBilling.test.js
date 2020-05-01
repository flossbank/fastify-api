const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const advertiserId1 = await db.createAdvertiser({
      firstName: 'Honesty',
      lastName: 'Empathy',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId1 = advertiserId1.toHexString()
    await db.verifyAdvertiser('honey@etsy.com')
    await db.updateAdvertiserCustomerId(t.context.advertiserId1, 'honesty-cust-id')
    await db.updateAdvertiserHasCardInfo(t.context.advertiserId1, true, '2222')

    t.context.sessionId1 = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId1 })

    // no billing info
    const advertiserId2 = await db.createAdvertiser({
      firstName: 'Papa',
      lastName: 'John',
      email: 'papa@papajohns.com',
      password: 'pizza4life'
    })
    t.context.advertiserId2 = advertiserId2.toHexString()
    await db.verifyAdvertiser('papa@papajohns.com')

    t.context.sessionId2 = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId2 })
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('POST `/advertiser/update/billing` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update/billing',
    payload: { billingToken: 'new-stripe-token', last4: '1234' },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/update/billing` 200 success | update card on file', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update/billing',
    payload: { billingToken: 'stripe-billing-token', last4: '1234' },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId1)
  t.deepEqual(advertiser.billingInfo.customerId, 'honesty-cust-id')
  t.deepEqual(advertiser.billingInfo.cardOnFile, true)
  t.deepEqual(advertiser.billingInfo.last4, '1234')

  t.true(t.context.stripe.createStripeCustomer.notCalled)
})

test('POST `/advertiser/update/billing` 200 success | first card added', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update/billing',
    payload: { billingToken: 'stripe-billing-token', last4: '1234' },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId2)
  t.deepEqual(advertiser.billingInfo.customerId, 'test-stripe-id')
  t.deepEqual(advertiser.billingInfo.cardOnFile, true)
  t.deepEqual(advertiser.billingInfo.last4, '1234')

  t.true(t.context.stripe.createStripeCustomer.calledOnce)
})

test('POST `/advertiser/update/billing` 500 server error', async (t) => {
  t.context.db.updateAdvertiserHasCardInfo = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update/billing',
    payload: { billingToken: 'new-stripe-token', last4: '1234' },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
