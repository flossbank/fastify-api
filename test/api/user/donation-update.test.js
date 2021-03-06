const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE, MSGS: { NO_DONATION } } = require('../../../helpers/constants')

test.before(async (t) => {
  sinon.stub(Date, 'now').returns(19991)
  await before(t, async ({ db, auth }) => {
    const threshold = t.context.config.getNoAdThreshold()
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId1, customerId: 'honesty-cust-id' })
    await db.user.updateHasCardInfo({ userId: t.context.userId1, last4: '2222' })
    await db.user.setDonation({ userId: t.context.userId1, amount: threshold - 1 })

    const sessionWithDonationCurrentlyBelow = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionWithDonationCurrentlyBelow = sessionWithDonationCurrentlyBelow.sessionId

    const { id: userId5 } = await db.user.create({ email: 'honeybooboo@etsy.com' })
    t.context.userId5 = userId5.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId5, customerId: 'honesty-cust-id' })
    await db.user.updateHasCardInfo({ userId: t.context.userId5, last4: '2222' })
    await db.user.setDonation({ userId: t.context.userId5, amount: threshold - 1 })

    const sessionWithDonation = await auth.user.createWebSession({ userId: t.context.userId5 })
    t.context.sessionWithDonation = sessionWithDonation.sessionId

    // User that will have donation updated to below threshold
    const { id: userId4 } = await db.user.create({ email: 'rip@vanwinkle.com' })
    t.context.userId4 = userId4.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId4, customerId: 'honesty-cust-id-4' })
    await db.user.updateHasCardInfo({ userId: t.context.userId4, last4: '2222' })
    await db.user.setDonation({ userId: t.context.userId4, amount: threshold + 1 })

    const sessionWithDonationCurrentyAbove = await auth.user.createWebSession({ userId: t.context.userId4 })
    t.context.sessionWithDonationCurrentyAbove = sessionWithDonationCurrentyAbove.sessionId

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
    await db.user.setDonation({ userId: t.context.userId3, amount: threshold + 1 })

    const sessionWithError = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.sessionWithError = sessionWithError.sessionId

    const { id: userId6 } = await db.user.create({ email: 'johngreene@dftba.com' })
    t.context.userId6 = userId6.toHexString()
    await db.user.updateCustomerId({ userId: t.context.userId6, customerId: 'john-cust-id' })
    await db.user.updateHasCardInfo({ userId: t.context.userId6, last4: '2222' })
    await db.user.setDonation({ userId: t.context.userId6, amount: threshold })

    const sessionWithThresholdDonation = await auth.user.createWebSession({ userId: t.context.userId6 })
    t.context.sessionWithThresholdDonation = sessionWithThresholdDonation.sessionId
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
  const threshold = t.context.config.getNoAdThreshold()
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: threshold - 1 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonationCurrentyAbove}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true, optOutOfAds: false })

  const user = await t.context.db.user.get({ userId: t.context.userId4 })
  t.deepEqual(user.optOutOfAds, false)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'honesty-cust-id-4')
  t.deepEqual(user.billingInfo.last4, '2222')

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === (threshold - 1) * 1000)
  t.true(donationLedgerAddition.timestamp === 19991)
  t.true(t.context.stripe.updateDonation.calledWith({
    customerId: user.billingInfo.customerId,
    amount: threshold - 1
  }))
})

test('PUT `/user/donation` 200 success | threshold above ad threshold', async (t) => {
  const threshold = t.context.config.getNoAdThreshold()
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: threshold + 1 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonationCurrentlyBelow}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true, optOutOfAds: true })

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(user.optOutOfAds, true)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'honesty-cust-id')
  t.deepEqual(user.billingInfo.last4, '2222')

  const userApiKey = await t.context.auth.user.getApiKey({ apiKey: user.apiKey })
  t.deepEqual(userApiKey.noAds, true)

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === (threshold + 1) * 1000)
  t.true(donationLedgerAddition.timestamp === 19991)
  t.true(t.context.stripe.updateDonation.calledWith({
    customerId: user.billingInfo.customerId,
    amount: threshold + 1
  }))
})

test('PUT `/user/donation` 200 success | updating donation to existing amount is a no-op', async (t) => {
  const threshold = t.context.config.getNoAdThreshold()
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: threshold, seeAds: true },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithThresholdDonation}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true, optOutOfAds: false })

  const user = await t.context.db.user.get({ userId: t.context.userId6 })
  t.deepEqual(user.optOutOfAds, false)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'john-cust-id')
  t.deepEqual(user.billingInfo.last4, '2222')

  const userApiKey = await t.context.auth.user.getApiKey({ apiKey: user.apiKey })
  t.deepEqual(userApiKey.noAds, false)

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === threshold * 1000)
  t.true(donationLedgerAddition.timestamp === 19991)
  t.true(t.context.stripe.updateDonation.calledWith({
    customerId: user.billingInfo.customerId,
    amount: threshold
  }))
})

test('PUT `/user/donation` 200 success | threshold above ad threshold but choose to see ads', async (t) => {
  const threshold = t.context.config.getNoAdThreshold()
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/user/donation',
    payload: { amount: threshold + 1, seeAds: true },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true, optOutOfAds: false })

  const user = await t.context.db.user.get({ userId: t.context.userId5 })
  t.deepEqual(user.optOutOfAds, false)
  t.deepEqual(user.billingInfo.monthlyDonation, true)
  t.deepEqual(user.billingInfo.customerId, 'honesty-cust-id')
  t.deepEqual(user.billingInfo.last4, '2222')

  const userApiKey = await t.context.auth.user.getApiKey({ apiKey: user.apiKey })
  t.deepEqual(userApiKey.noAds, false)

  const donationLedgerAddition = user.billingInfo.donationChanges.find(el => el.donationAmount === (threshold + 1) * 1000)
  t.true(donationLedgerAddition.timestamp === 19991)
  t.true(t.context.stripe.updateDonation.calledWith({
    customerId: user.billingInfo.customerId,
    amount: threshold + 1
  }))
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
  t.deepEqual(JSON.parse(res.payload), { success: false, message: NO_DONATION })

  const user = await t.context.db.user.get({ userId: t.context.userId2 })
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
  t.context.db.user.setDonation = () => { throw new Error() }
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
