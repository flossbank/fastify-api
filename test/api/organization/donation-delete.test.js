const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE, MSGS: { NO_DONATION, INSUFFICIENT_PERMISSIONS } } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    sinon.stub(Date, 'now').returns(1234)
    const email = 'honey@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()

    const { id: orgId1 } = await db.organization.create({
      name: 'flossbank',
      host: 'GitHub',
      userId: t.context.userId1,
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
      userId: t.context.userId2,
      email
    })
    t.context.orgId2 = orgId2.toString()
    await db.organization.updateCustomerId({ orgId: t.context.orgId2, customerId: 'honesty-cust-id-2' })

    const sessionWithoutDonation = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.sessionWithoutDonation = sessionWithoutDonation.sessionId

    // User that receives an error
    const { id: userId3 } = await db.user.create({ email: 'black@pick.com' })
    t.context.userId3 = userId3.toHexString()

    const { id: orgId3 } = await db.organization.create({
      name: 'js-deep-equals',
      host: 'GitHub',
      userId: t.context.userId3,
      email
    })
    t.context.orgId3 = orgId3.toString()
    await db.organization.updateCustomerId({ orgId: t.context.orgId3, customerId: 'honesty-cust-id-3' })
    await db.organization.setDonation({ orgId: t.context.orgId3, amount: 1000, globalDonation: false })

    const sessionWithError = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.sessionWithError = sessionWithError.sessionId

    // Org with no customer id
    const { id: userId4 } = await db.user.create({ email: 'white@pick.com' })
    t.context.userId4 = userId4.toHexString()

    const { id: orgId4 } = await db.organization.create({
      name: 'lodash',
      host: 'GitHub',
      userId: t.context.userId4,
      email
    })
    t.context.orgId4 = orgId4.toString()
    await db.organization.setDonation({ orgId: t.context.orgId4, amount: 1000, globalDonation: false })

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

test('DELETE `/organization/donation` 401 unauthorized | middleware', async (t) => {
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/organization/donation',
    query: { organizationId: t.context.orgId1 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('DELETE `/organization/donation` 401 unauthorized | user doesnt have perms', async (t) => {
  // User with cookie "sessionWithDonation" doesn't have perms for org 4
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/organization/donation',
    query: { organizationId: t.context.orgId4 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 401)
  t.deepEqual(JSON.parse(res.payload), {
    success: false,
    message: INSUFFICIENT_PERMISSIONS
  })
})

test('DELETE `/organization/donation` 404 unauthorized | no org found', async (t) => {
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/organization/donation',
    query: { organizationId: 'aaaaaaaaaaaa' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('DELETE `/organization/donation` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/organization/donation',
    query: { organizationId: t.context.orgId1 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  t.true(t.context.stripe.deleteDonation.calledWith({
    customerId: org.billingInfo.customerId
  }))
  t.false(org.monthlyDonation)

  const donationLedgerAddition = org.donationChanges.find(el => el.donationAmount === 0)
  t.true(donationLedgerAddition.timestamp === 1234)
  t.false(donationLedgerAddition.globalDonation)
})

test('DELETE `/organization/donation` 404 error | donation not found', async (t) => {
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/organization/donation',
    query: { organizationId: t.context.orgId2 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutDonation}`
    }
  })
  t.deepEqual(res.statusCode, 404)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: NO_DONATION })
  t.true(t.context.stripe.deleteDonation.notCalled)
})

test('DELETE `/organization/donation` Error thrown when no customer id', async (t) => {
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/organization/donation',
    query: { organizationId: t.context.orgId4 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutCustomerId}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})

test('DELETE `/organization/donation` 500 server error', async (t) => {
  t.context.stripe.deleteDonation = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/organization/donation',
    query: { organizationId: t.context.orgId3 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithError}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
