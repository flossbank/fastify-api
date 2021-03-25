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
    await db.organization.updateDescription({ orgId: t.context.orgId1, description: 'test-desc' })

    const { id: orgId2 } = await db.organization.create({
      name: 'tf',
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

test('GET `/organization/:organizationId` unauthorized | send back public org data', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: `/organization/${t.context.orgId1}`,
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    organization: {
      id: t.context.orgId1,
      avatarUrl: 'blah.com',
      description: 'test-desc',
      name: 'flossbank',
      globalDonation: false,
      donationAmount: 1000000
    }
  })
})

test('GET `/organization/:organizationId` unauthorized | not GH owner | send back public org data', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(false)
  const res = await t.context.app.inject({
    method: 'GET',
    url: `/organization/${t.context.orgId1}`,
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    organization: {
      id: t.context.orgId1,
      avatarUrl: 'blah.com',
      description: 'test-desc',
      name: 'flossbank',
      globalDonation: false,
      donationAmount: 1000000
    }
  })
})

test('GET `/organization/:organizationId` authorized | send back private org data', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: `/organization/${t.context.orgId1}`,
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  const org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  org.id = org.id.toString()
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    organization: {
      ...org,
      billingInfo: {
        ...org.billingInfo,
        last4: '4242'
      }
    }
  })
})

test('GET `/organization/:organizationId` authorized | fetching last4 throws', async (t) => {
  t.context.stripe.getCustomerLast4.throws()
  const res = await t.context.app.inject({
    method: 'GET',
    url: `/organization/${t.context.orgId1}`,
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  const org = await t.context.db.organization.get({ orgId: t.context.orgId1 })
  org.id = org.id.toString()
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    organization: org
  })
})

test('GET `/organization/:organizationId` authorized | no customer id', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: `/organization/${t.context.orgId2}`,
    query: {
      organizationId: t.context.orgId2
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  const org = await t.context.db.organization.get({ orgId: t.context.orgId2 })
  org.id = org.id.toString()
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    organization: org
  })
})

test('GET `/organization/:organizationId` 404 no org', async (t) => {
  t.context.db.organization.get = () => undefined
  const res = await t.context.app.inject({
    method: 'GET',
    url: `/organization/${t.context.orgId1}`,
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('GET `/organization/:organizationId` 500 error', async (t) => {
  t.context.db.organization.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: `/organization/${t.context.orgId1}`,
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithDonation}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
