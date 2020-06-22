const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    sinon.stub(Date, 'now').returns(123456)
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId1, customerId: 'honesty-cust-id' })
    await db.user.updateHasCardInfo({ userId: t.context.userId1, last4: '2222' })

    t.context.sessionWithBillingInfo = await auth.user.createWebSession({ userId: t.context.userId1 })

    // no billing info
    const { id: userId2 } = await db.user.create({ email: 'papa@papajohns.com' })
    t.context.userId2 = userId2.toHexString()

    t.context.sessionWithoutBillingInfo = await auth.user.createWebSession({ userId: t.context.userId2 })

    // User that wont opt out of ads with donation
    const { id: userId3 } = await db.user.create({ email: 'first@pick.com' })
    t.context.userId3 = userId3.toHexString()

    t.context.sessionThatWontBuyNoAds = await auth.user.createWebSession({ userId: t.context.userId3 })

    // User that receives an error
    const { id: userId4 } = await db.user.create({ email: 'black@pick.com' })
    t.context.userId4 = userId4.toHexString()

    t.context.sessionWithError = await auth.user.createWebSession({ userId: t.context.userId4 })
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

test('POST `/user/donation` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/donation',
    payload: { billingToken: 'new-stripe-token', last4: '1234', amount: 1000 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/donation` 200 success | update card on file and choose to see ads', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/donation',
    payload: { billingToken: 'stripe-billing-token', last4: '1234', amount: 1500, seeAds: true },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithBillingInfo}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(user.optOutOfAds, undefined)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'honesty-cust-id')
  t.deepEqual(user.billingInfo.last4, '1234')

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === 1500000)
  t.true(donationLedgerAddition.timestamp === 123456)
  t.true(t.context.stripe.createStripeCustomer.notCalled)
  t.true(t.context.stripe.updateStripeCustomer.calledWith('honesty-cust-id', 'stripe-billing-token'))
  t.true(t.context.stripe.createDonation.calledWith(user.billingInfo.customerId, 1500))

  // Should return 409 for same sessions attempt at creating a donation
  const res2 = await t.context.app.inject({
    method: 'POST',
    url: '/user/donation',
    payload: { billingToken: 'new-stripe-token', last4: '1234', amount: 1000 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithBillingInfo}`
    }
  })
  t.deepEqual(res2.statusCode, 409)
})

test('POST `/user/donation` 200 success | first card added and above disable ads threshold', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/donation',
    payload: { billingToken: 'stripe-billing-token', last4: '1234', amount: 1000 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutBillingInfo}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const user = await t.context.db.user.get({ userId: t.context.userId2 })
  t.deepEqual(user.optOutOfAds, true)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'test-stripe-id')
  t.deepEqual(user.billingInfo.last4, '1234')

  const userApiKey = await t.context.auth.user.getApiKey({ apiKey: user.apiKey })
  t.deepEqual(userApiKey.noAds, true)

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === 1000000)
  t.true(donationLedgerAddition.timestamp === 123456)
  t.true(t.context.stripe.createStripeCustomer.calledOnce)
  t.true(t.context.stripe.updateStripeCustomer.calledWith('test-stripe-id', 'stripe-billing-token'))
  t.true(t.context.stripe.createDonation.calledWith(user.billingInfo.customerId, 1000))
})

test('POST `/user/donation` 200 success | donation below threshold to disable ads', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/donation',
    payload: { billingToken: 'stripe-billing-token', last4: '1234', amount: 900 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionThatWontBuyNoAds}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const user = await t.context.db.user.get({ userId: t.context.userId3 })
  t.deepEqual(user.optOutOfAds, undefined)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'test-stripe-id')
  t.deepEqual(user.billingInfo.last4, '1234')

  const userApiKey = await t.context.auth.user.getApiKey({ apiKey: user.apiKey })
  // In this situation the api key hasn't even been cached
  t.deepEqual(userApiKey, undefined)

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === 900000)
  t.true(donationLedgerAddition.timestamp === 123456)
  t.true(t.context.stripe.createStripeCustomer.calledOnce)
  t.true(t.context.stripe.updateStripeCustomer.calledWith('test-stripe-id', 'stripe-billing-token'))
  t.true(t.context.stripe.createDonation.calledWith(user.billingInfo.customerId, 900))
})

test('POST `/user/donation` 500 server error', async (t) => {
  t.context.db.user.updateHasCardInfo = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/donation',
    payload: { billingToken: 'new-stripe-token', last4: '1234', amount: 1000 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithError}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
