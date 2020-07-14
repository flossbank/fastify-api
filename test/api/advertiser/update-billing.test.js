const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const advertiserId1 = await db.advertiser.create({
      advertiser: {
        firstName: 'Honesty',
        lastName: 'Empathy',
        email: 'honey@etsy.com',
        password: 'beekeeperbookkeeper'
      }
    })
    t.context.advertiserId1 = advertiserId1.toHexString()
    await db.advertiser.verify({ email: 'honey@etsy.com' })
    await db.advertiser.updateCustomerId({ advertiserId: t.context.advertiserId1, customerId: 'honesty-cust-id' })
    await db.advertiser.updateHasCardInfo({ advertiserId: t.context.advertiserId1, last4: '2222' })

    const session1 = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId1 })
    t.context.sessionId1 = session1.sessionId

    // no billing info
    const advertiserId2 = await db.advertiser.create({
      advertiser: {
        firstName: 'Papa',
        lastName: 'John',
        email: 'papa@papajohns.com',
        password: 'pizza4life'
      }
    })
    t.context.advertiserId2 = advertiserId2.toHexString()
    await db.advertiser.verify({ email: 'papa@papajohns.com' })

    const session2 = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId2 })
    t.context.sessionId2 = session2.sessionId
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

test('POST `/advertiser/update-billing` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update-billing',
    payload: { billingToken: 'new-stripe-token', last4: '1234' },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/update-billing` 200 success | update card on file', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update-billing',
    payload: { billingToken: 'stripe-billing-token', last4: '1234' },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.advertiser.get({
    advertiserId: t.context.advertiserId1
  })
  t.deepEqual(advertiser.billingInfo.customerId, 'honesty-cust-id')
  t.deepEqual(advertiser.billingInfo.last4, '1234')

  t.true(t.context.stripe.createStripeCustomer.notCalled)
})

test('POST `/advertiser/update-billing` 200 success | first card added', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update-billing',
    payload: { billingToken: 'stripe-billing-token', last4: '1234' },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.advertiser.get({
    advertiserId: t.context.advertiserId2
  })
  t.deepEqual(advertiser.billingInfo.customerId, 'test-stripe-id')
  t.deepEqual(advertiser.billingInfo.last4, '1234')

  t.true(t.context.stripe.createStripeCustomer.calledOnce)
})

test('POST `/advertiser/update-billing` 500 server error', async (t) => {
  t.context.db.advertiser.updateHasCardInfo = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update-billing',
    payload: { billingToken: 'new-stripe-token', last4: '1234' },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
