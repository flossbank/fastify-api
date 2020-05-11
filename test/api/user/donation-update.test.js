const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    sinon.stub(Date, 'now').returns(19991)
    const { id: userId1 } = await db.createUser({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.updateUserCustomerId({ userId: t.context.userId1, customerId: 'honesty-cust-id' })
    await db.updateUserHasCardInfo({ userId: t.context.userId1, last4: '2222' })
    await db.setUserDonation({ userId: t.context.userId1, amount: 500 })

    t.context.sessionWithDonationCurrentlyBelow = await auth.user.createWebSession({ userId: t.context.userId1 })

    // User that will have donation updated to below threshold
    const { id: userId4 } = await db.createUser({ email: 'rip@vanwinkle.com' })
    t.context.userId4 = userId4.toHexString()
    await db.updateUserCustomerId({ userId: t.context.userId4, customerId: 'honesty-cust-id-4' })
    await db.updateUserHasCardInfo({ userId: t.context.userId4, last4: '2222' })
    await db.setUserDonation({ userId: t.context.userId4, amount: 1500 })

    t.context.sessionWithDonationCurrentyAbove = await auth.user.createWebSession({ userId: t.context.userId4 })

    // no donation
    const { id: userId2 } = await db.createUser({ email: 'papa@papajohns.com' })
    t.context.userId2 = userId2.toHexString()
    await db.updateUserCustomerId({ userId: t.context.userId2, customerId: 'honesty-cust-id-2' })
    await db.updateUserHasCardInfo({ userId: t.context.userId2, last4: '2222' })

    t.context.sessionWithoutDonation = await auth.user.createWebSession({ userId: t.context.userId2 })

    // User that receives an error
    const { id: userId3 } = await db.createUser({ email: 'black@pick.com' })
    t.context.userId3 = userId3.toHexString()
    await db.updateUserCustomerId({ userId: t.context.userId3, customerId: 'honesty-cust-id-3' })
    await db.updateUserHasCardInfo({ userId: t.context.userId3, last4: '2222' })
    await db.setUserDonation({ userId: t.context.userId3, amount: 1500 })

    t.context.sessionWithError = await auth.user.createWebSession({ userId: t.context.userId3 })
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

test('PUT `/user/donation` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: 1000 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('PUT `/user/donation` 200 success | threshold below ad threshold', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: 500 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonationCurrentyAbove}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const user = await t.context.db.getUserById({ userId: t.context.userId4 })
  t.deepEqual(user.optOutOfAds, false)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'honesty-cust-id-4')
  t.deepEqual(user.billingInfo.last4, '2222')

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === 500000)
  t.true(donationLedgerAddition.timestamp === 19991)
  t.true(t.context.stripe.updateDonation.calledWith(user.billingInfo.customerId, 500))
})

test('PUT `/user/donation` 200 success | threshold above ad threshold', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: 1500 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonationCurrentlyBelow}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const user = await t.context.db.getUserById({ userId: t.context.userId1 })
  t.deepEqual(user.optOutOfAds, true)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'honesty-cust-id')
  t.deepEqual(user.billingInfo.last4, '2222')

  const userApiKey = await t.context.auth.user.getApiKey({ apiKey: user.apiKey })
  t.deepEqual(userApiKey.noAds, true)

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === 1500000)
  t.true(donationLedgerAddition.timestamp === 19991)
  t.true(t.context.stripe.updateDonation.calledWith(user.billingInfo.customerId, 1500))
})

test('PUT `/user/donation` 404 error | donation not found', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: 900 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutDonation}`
    }
  })
  t.deepEqual(res.statusCode, 404)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: 'No donation found' })

  const user = await t.context.db.getUserById({ userId: t.context.userId2 })
  t.deepEqual(user.optOutOfAds, undefined)
  t.deepEqual(user.billingInfo.monthlyDonation, undefined)
  t.deepEqual(user.billingInfo.customerId, 'honesty-cust-id-2')
  t.deepEqual(user.billingInfo.last4, '2222')

  const userApiKey = await t.context.auth.user.getApiKey({ apiKey: user.apiKey })
  // In this situation the api key hasn't even been cached
  t.deepEqual(userApiKey, undefined)
  t.true(t.context.stripe.updateDonation.notCalled)
})

test('PUT `/user/donation` 500 server error', async (t) => {
  t.context.db.setUserDonation = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: 2000 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithError}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
