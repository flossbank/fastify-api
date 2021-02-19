const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE, MSGS: { ORG_MISSING_BILLING_EMAIL } } = require('../../../helpers/constants')

test.before(async (t) => {
  sinon.stub(Date, 'now').returns(123456)
  await before(t, async ({ db, auth }) => {
    const { id: userId1, email } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toString()

    const { id: orgId1 } = await db.organization.create({
      name: 'flossbank',
      host: 'GitHub',
      email
    })
    t.context.orgId1 = orgId1.toString()
    await db.organization.updateCustomerId({ orgId: t.context.orgId1, customerId: 'honesty-cust-id' })

    const sessionWithBillingInfo = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionWithBillingInfo = sessionWithBillingInfo.sessionId

    // no billing info
    const { id: userId2 } = await db.user.create({ email: 'papa@papajohns.com' })
    t.context.userId2 = userId2.toString()

    const { id: orgId2 } = await db.organization.create({
      name: 'vscodium',
      host: 'GitHub',
      email
    })
    t.context.orgId2 = orgId2.toString()

    const sessionWithoutBillingInfo = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.sessionWithoutBillingInfo = sessionWithoutBillingInfo.sessionId

    // Error org
    const { id: orgId3 } = await db.organization.create({
      name: 'vscodium',
      host: 'GitHub',
      email
    })
    t.context.orgId3 = orgId3.toString()

    // Org without email
    const { id: orgId4 } = await db.organization.create({
      name: 'boop-boop',
      host: 'GitHub'
    })
    t.context.orgId4 = orgId4.toString()
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

test('POST `/organization/donation` 401 unauthorized | middleware', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/donation',
    payload: {
      billingToken: 'new-stripe-token',
      organizationId: t.context.orgId1,
      globalDonation: false,
      amount: 1000
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/organization/donation` Failure | no email on org', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/donation',
    payload: {
      billingToken: 'new-stripe-token',
      organizationId: t.context.orgId4,
      globalDonation: false,
      amount: 1000
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithBillingInfo}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: ORG_MISSING_BILLING_EMAIL })
})

test('POST `/organization/donation` 401 unauthorized | user doesnt have access', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(false)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/donation',
    payload: {
      billingToken: 'new-stripe-token',
      organizationId: t.context.orgId1,
      globalDonation: false,
      amount: 1000
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutBillingInfo}`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/organization/donation` 404 | no org by that id', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/donation',
    payload: {
      billingToken: 'new-stripe-token',
      organizationId: 'aaaaaaaaaaaa',
      globalDonation: false,
      amount: 1000
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutBillingInfo}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('POST `/organization/donation` 200 success | update card on file', async (t) => {
  const amountToDonateCents = 1000000
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/donation',
    payload: {
      billingToken: 'stripe-billing-token',
      organizationId: t.context.orgId1,
      globalDonation: false,
      amount: amountToDonateCents
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithBillingInfo}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  t.deepEqual(org.monthlyDonation, true)
  t.deepEqual(org.billingInfo.customerId, 'honesty-cust-id')
  t.deepEqual(org.donationAmount, amountToDonateCents * 1000)
  t.deepEqual(org.globalDonation, false)

  const donationLedgerAddition = org.donationChanges.find(el => el.donationAmount === amountToDonateCents * 1000)
  t.true(donationLedgerAddition.timestamp === 123456)
  t.false(donationLedgerAddition.globalDonation)
  t.true(t.context.stripe.createStripeCustomer.notCalled)
  t.true(t.context.stripe.updateStripeCustomer.calledWith({
    customerId: 'honesty-cust-id',
    sourceId: 'stripe-billing-token'
  }))
  t.true(t.context.stripe.createDonation.calledWith({
    customerId: org.billingInfo.customerId,
    amount: amountToDonateCents
  }))

  // Should return 409 for same sessions attempt at creating a donation
  const res2 = await t.context.app.inject({
    method: 'POST',
    url: '/organization/donation',
    payload: { billingToken: 'new-stripe-token', organizationId: t.context.orgId1, amount: amountToDonateCents },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithBillingInfo}`
    }
  })
  t.deepEqual(res2.statusCode, 409)
})

test('POST `/organization/donation` 200 success | first card added ', async (t) => {
  const amountToDonateCents = 1000000
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/donation',
    payload: {
      billingToken: 'stripe-billing-token',
      organizationId: t.context.orgId2,
      amount: amountToDonateCents,
      globalDonation: true,
      publicallyGive: true
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutBillingInfo}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const org = await t.context.db.organization.get({ orgId: t.context.orgId2 })
  t.deepEqual(org.monthlyDonation, true)
  t.deepEqual(org.billingInfo.customerId, 'test-stripe-id')
  t.deepEqual(org.donationAmount, amountToDonateCents * 1000)
  t.deepEqual(org.globalDonation, true)
  t.deepEqual(org.publicallyGive, true)

  const donationLedgerAddition = org.donationChanges.find(el => el.donationAmount === amountToDonateCents * 1000)
  t.true(donationLedgerAddition.timestamp === 123456)
  t.true(donationLedgerAddition.globalDonation)
  t.true(t.context.stripe.createStripeCustomer.calledOnce)
  t.true(t.context.stripe.updateStripeCustomer.calledWith({
    customerId: 'test-stripe-id',
    sourceId: 'stripe-billing-token'
  }))
  t.true(t.context.stripe.createDonation.calledWith({
    customerId: org.billingInfo.customerId,
    amount: amountToDonateCents
  }))
})

test('POST `/organization/donation` 500 server error', async (t) => {
  t.context.db.organization.setDonation = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/donation',
    payload: {
      billingToken: 'new-stripe-token',
      organizationId: t.context.orgId3,
      amount: 1000,
      globalDonation: true
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutBillingInfo}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
