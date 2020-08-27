const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE, MSGS: { NO_DONATION } } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    sinon.stub(Date, 'now').returns(1234)
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId1, customerId: 'honesty-cust-id' })
    await db.user.updateHasCardInfo({ userId: t.context.userId1, last4: '2222' })
    await db.user.setDonation({ userId: t.context.userId1, amount: 1000 })

    const sessionWithDonation = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionWithDonation = sessionWithDonation.sessionId

    // no donation
    const { id: userId2 } = await db.user.create({ email: 'papa@papajohns.com' })
    t.context.userId2 = userId2.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId2, customerId: 'honesty-cust-id-2' })
    await db.user.updateHasCardInfo({ userId: t.context.userId2, last4: '2222' })

    const sessionWithoutDonation = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.sessionWithoutDonation = sessionWithoutDonation.sessionId

    // User that receives an error
    const { id: userId3 } = await db.user.create({ email: 'black@pick.com' })
    t.context.userId3 = userId3.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId3, customerId: 'honesty-cust-id-3' })
    await db.user.updateHasCardInfo({ userId: t.context.userId3, last4: '2222' })
    await db.user.setDonation({ userId: t.context.userId3, amount: 1500 })

    const sessionWithError = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.sessionWithError = sessionWithError.sessionId

    // User with no customer id
    const { id: userId4 } = await db.user.create({ email: 'white@pick.com' })
    t.context.userId4 = userId4.toHexString()
    await db.user.setDonation({ userId: t.context.userId4, amount: 1500 })

    const sessionWithoutCustomerId = await auth.user.createWebSession({ userId: t.context.userId4 })
    t.context.sessionWithoutCustomerId = sessionWithoutCustomerId.sessionId
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

test('GET `/user/get-donation-info` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-donation-info',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/user/get-donation-info` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-donation-info',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    donationInfo: { amount: 1000, last4: '4242', renewal: 1595197107000 }
  })
  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.true(t.context.stripe.getStripeCustomerDonationInfo.calledWith({
    customerId: user.billingInfo.customerId
  }))
})

test('GET `/user/get-donation-info` 404 error | donation not found', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-donation-info',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutDonation}`
    }
  })
  t.deepEqual(res.statusCode, 404)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: NO_DONATION })
  t.true(t.context.stripe.getStripeCustomerDonationInfo.notCalled)
})

test('GET `/user/get-donation-info` Error thrown when no customer id', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-donation-info',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutCustomerId}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})

test('GET `/user/get-donation-info` 500 server error', async (t) => {
  t.context.stripe.getStripeCustomerDonationInfo = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-donation-info',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithError}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
