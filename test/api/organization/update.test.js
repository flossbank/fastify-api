const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const email = 'honey@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()

    const { id: orgId1 } = await db.organization.create({
      name: 'flossbank',
      host: 'GitHub',
      userId: t.context.userId1,
      avatarUrl: 'blah.com',
      email
    })
    t.context.orgId1 = orgId1.toString()
    await db.organization.updateCustomerId({ orgId: t.context.orgId1, customerId: 'honesty-cust-id' })
    await db.organization.setDonation({ orgId: t.context.orgId1, amount: 1000, globalDonation: false })

    const { id: orgId2 } = await db.organization.create({
      name: 'flossbank-2',
      host: 'GitHub',
      userId: t.context.userId1,
      avatarUrl: 'blah.com',
      email
    })
    t.context.orgId2 = orgId2.toString()

    const sessionWithDonation = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionWithDonation = sessionWithDonation.sessionId
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

test('PUT `/organization` 401 | unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: t.context.orgId1,
      billingEmail: 'boop@boop.com'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=bad_session`
    }
  })
  t.is(res.statusCode, 401)
})

test('PUT `/organization` 404 no org', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(false)
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: 'aaaaaaaaaaaa',
      billingEmail: 'boop@boop.com'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.is(res.statusCode, 404)
})

test('PUT `/organization` 401 | user isnt authorized to update org', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(false)
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: t.context.orgId1,
      billingEmail: 'boop@boop.com'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.is(res.statusCode, 401)
})

test('PUT `/organization` authorized | success - update billing email', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: t.context.orgId1,
      billingEmail: 'boop@boop.com'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  const org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true
  })
  t.is(org.email, 'boop@boop.com')
})

test('PUT `/organization` authorized | success - update billing email - creates stripe customer', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: t.context.orgId2,
      billingEmail: 'newBilling@boop.com'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  const org = await t.context.db.organization.get({ orgId: t.context.orgId2 })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true
  })
  t.is(org.email, 'newBilling@boop.com')
  t.is(org.billingInfo.customerId, 'test-stripe-id')
})

test('PUT `/organization` authorized | success - update publically give', async (t) => {
  let res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: t.context.orgId1,
      publicallyGive: true
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  let org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true
  })
  t.is(org.publicallyGive, true)

  res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: t.context.orgId1,
      publicallyGive: false
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true
  })
  t.is(org.publicallyGive, false)
})

test('PUT `/organization` authorized | success - update description', async (t) => {
  const newDesc = 'Here at flossbank we do a lot of cool stuff blah blah blah'
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: t.context.orgId1,
      description: newDesc
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  const org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true
  })
  t.is(org.description, newDesc)
})

test('PUT `/organization/:organizationId` 500 error', async (t) => {
  t.context.stripe.updateCustomerEmail = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/organization',
    body: {
      organizationId: t.context.orgId1,
      billingEmail: 'test@test.com'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
