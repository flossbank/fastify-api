const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId1, customerId: 'honesty-cust-id' })
    await db.user.updateHasCardInfo({ userId: t.context.userId1, last4: '2222' })

    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionId1 = session1.sessionId

    // no billing info
    const { id: userId2 } = await db.user.create({ email: 'papa@papajohns.com' })
    t.context.userId2 = userId2.toHexString()

    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
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

test('POST `/user/update-billing` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/update-billing',
    payload: { billingToken: 'new-stripe-token', last4: '1234' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/update-billing` 200 success | update card on file', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/update-billing',
    payload: { billingToken: 'stripe-billing-token', last4: '1234' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(user.billingInfo.customerId, 'honesty-cust-id')
  t.deepEqual(user.billingInfo.last4, '1234')

  t.true(t.context.stripe.createStripeCustomer.notCalled)
})

test('POST `/user/update-billing` 200 success | first card added', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/update-billing',
    payload: { billingToken: 'stripe-billing-token', last4: '1234' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const user = await t.context.db.user.get({ userId: t.context.userId2 })
  t.deepEqual(user.billingInfo.customerId, 'test-stripe-id')
  t.deepEqual(user.billingInfo.last4, '1234')

  t.true(t.context.stripe.createStripeCustomer.calledOnce)
})

test('POST `/user/update-billing` 500 server error', async (t) => {
  t.context.db.user.updateHasCardInfo = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/update-billing',
    payload: { billingToken: 'new-stripe-token', last4: '1234' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
