const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE, MSGS: { INSUFFICIENT_PERMISSIONS } } = require('../../../helpers/constants')

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

test('GET `/organization/get-impact` 401 unauthorized | middleware', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-impact',
    query: { organizationId: t.context.orgId1 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/organization/get-impact` 401 unauthorized | user doesnt have perms', async (t) => {
  // User with cookie "sessionWithDonation" doesn't have perms for org 4
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-impact',
    query: { organizationId: t.context.orgId3 },
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

test('GET `/organization/get-impact` 404 unauthorized | no org found', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-impact',
    query: { organizationId: 'aaaaaaaaaaaa' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('GET `/organization/get-impact` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-impact',
    query: { organizationId: t.context.orgId1 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    orgImpact: { packagesDonatedTo: 100, amount: 200000 }
  })
})

test('GET `/organization/get-impact` 500 server error', async (t) => {
  t.context.db.organization.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-impact',
    query: { organizationId: t.context.orgId3 },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithError}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
