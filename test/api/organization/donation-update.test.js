const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE, MSGS: { NO_DONATION, INSUFFICIENT_PERMISSIONS } } = require('../../../helpers/constants')

test.before(async (t) => {
  sinon.stub(Date, 'now').returns(19991)
  await before(t, async ({ db, auth }) => {
    const email = 'honey@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()

    const { id: orgId1 } = await db.organization.create({
      name: 'flossbank',
      host: 'GitHub',
      email
    })
    t.context.orgId1 = orgId1.toString()
    await db.organization.updateCustomerId({ orgId: t.context.orgId1, customerId: 'honesty-cust-id' })
    await db.organization.setDonation({ orgId: t.context.orgId1, amount: 1000, globalDonation: false })

    const sessionWithDonation = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionWithDonation = sessionWithDonation.sessionId

    // no donation
    const { id: userId2 } = await db.user.create({ email: 'papa@papajohns.com' })
    t.context.userId2 = userId2.toHexString()

    const { id: orgId2 } = await db.organization.create({
      name: 'vscodium',
      host: 'GitHub',
      email
    })
    t.context.orgId2 = orgId2.toString()
    await db.organization.updateCustomerId({ orgId: t.context.orgId2, customerId: 'honesty-cust-id-2' })

    const sessionWithoutDonation = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.sessionWithoutDonation = sessionWithoutDonation.sessionId
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

test('PUT `/organization/donation` 401 unauthorized | middleware', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization/donation',
    payload: {
      amount: 1000,
      organizationId: 'bbbbbbbbbbbb',
      globalDonation: false
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('PUT `/organization/donation` 401 unauthorized | user doesnt have perms', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization/donation',
    payload: {
      amount: 1000,
      organizationId: t.context.orgId1,
      globalDonation: false
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutDonation}`
    }
  })
  t.deepEqual(res.statusCode, 401)
  t.deepEqual(JSON.parse(res.payload), {
    success: false,
    message: INSUFFICIENT_PERMISSIONS
  })
})

test('PUT `/organization/donation` 404 no org', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization/donation',
    payload: {
      amount: 1000,
      organizationId: 'bbbbbbbbbbbb',
      globalDonation: false
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('PUT `/organization/donation` 400', async (t) => {
  // No org id
  let res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization/donation',
    payload: {
      amount: 1000,
      globalDonation: false
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  // No amount
  res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization/donation',
    payload: {
      organizationId: 'bbbbbbbbbbbb'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test.failing('PUT `/organization/donation` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization/donation',
    payload: {
      amount: 1000,
      organizationId: t.context.orgId1,
      globalDonation: false
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  t.deepEqual(org.monthlyDonation, true)
  t.deepEqual(org.billingInfo.customerId, 'honesty-cust-id')

  const donationLedgerAddition = org.donationChanges.find(el => el.donationAmount === 1000 * 1000)
  t.true(donationLedgerAddition.timestamp === 19991)
  t.false(donationLedgerAddition.globalDonation)
  t.true(t.context.stripe.updateDonation.calledWith({
    customerId: org.billingInfo.customerId,
    amount: 1000
  }))
})

test.failing('PUT `/organization/donation` 404 error | donation not found', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization/donation',
    payload: {
      amount: 100000,
      organizationId: t.context.orgId2,
      globalDonation: false
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutDonation}`
    }
  })
  t.deepEqual(res.statusCode, 404)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: NO_DONATION })

  const org = await t.context.db.organization.get({ orgId: t.context.orgId2 })
  t.deepEqual(org.monthlyDonation, undefined)
  t.deepEqual(org.billingInfo.customerId, 'honesty-cust-id-2')
  t.true(t.context.stripe.updateDonation.notCalled)
})

test('PUT `/organization/donation` 500 server error', async (t) => {
  t.context.db.organization.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization/donation',
    payload: {
      amount: 100000,
      organizationId: t.context.orgId1,
      globalDonation: false
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
