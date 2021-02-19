const test = require('ava')
const { ObjectId } = require('mongodb')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE, MSGS: { INSUFFICIENT_PERMISSIONS } } = require('../../../helpers/constants')

test.before(async (t) => {
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

    const sessionWithPublicDonations = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionWithPublicDonations = sessionWithPublicDonations.sessionId

    const { id: orgId2 } = await db.organization.create({
      name: 'vscodium',
      host: 'GitHub',
      email
    })
    t.context.orgId2 = orgId2.toString()
    await db.db.collection('organizations').updateOne({
      _id: ObjectId(t.context.orgId2)
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const mockDonationRevenue = [
      {
        organizationId: t.context.orgId1,
        amount: 100000,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId1,
        amount: 10000,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId2,
        amount: 10000,
        timestamp: 1598475250862
      }
    ]

    // pkg that is being donated to
    const { id: yttriumId } = await db.package.create({
      name: 'yttrium-server',
      registry: 'npm',
      language: 'javascript'
    })
    t.context.packageId1 = yttriumId.toString()

    await db.db.collection('packages').updateOne({
      _id: yttriumId
    }, {
      $set: {
        donationRevenue: mockDonationRevenue,
        maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }]
      }
    })

    const { id: flossId } = await db.package.create({
      name: 'flossbank',
      registry: 'npm',
      language: 'javascript'
    })
    t.context.packageId2 = flossId.toString()

    const mockDonationRevenue2 = [
      {
        organizationId: t.context.orgId1,
        amount: 5000,
        timestamp: 1598475250862
      },
      {
        organizationId: 'aaaaaaaaaaaa',
        amount: 5000,
        timestamp: 1598475250862
      }
    ]

    await db.db.collection('packages').updateOne({
      _id: flossId
    }, {
      $set: {
        donationRevenue: mockDonationRevenue2
      }
    })
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

test('GET `/organization/get-donation-ledger` 401 unauthorized | user is not an admin && public donations field is false', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(false)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-donation-ledger',
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithPublicDonations}`
    }
  })
  t.deepEqual(res.statusCode, 401)
  t.deepEqual(JSON.parse(res.payload), {
    success: false,
    message: INSUFFICIENT_PERMISSIONS
  })
})

test('GET `/organization/get-donation-ledger` 401 unauthorized | unauthed && public donations field is false', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(false)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-donation-ledger',
    query: {
      organizationId: t.context.orgId1
    }
  })
  t.deepEqual(res.statusCode, 401)
  t.deepEqual(JSON.parse(res.payload), {
    success: false,
    message: INSUFFICIENT_PERMISSIONS
  })
})

test('GET `/organization/get-donation-ledger` 404 no org', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-donation-ledger',
    query: {
      organizationId: 'bbbbbbbbbbbb'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithPublicDonations}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('GET `/organization/get-donation-ledger` 400', async (t) => {
  // No org id
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-donation-ledger',
    query: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithPublicDonations}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/organization/get-donation-ledger` 200 success | user admin of org', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(true)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-donation-ledger',
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithPublicDonations}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload),
    {
      success: true,
      ledger: [
        {
          id: t.context.packageId2,
          name: 'flossbank',
          registry: 'npm',
          maintainers: null,
          totalPaid: 5000
        },
        {
          id: t.context.packageId1,
          name: 'yttrium-server',
          registry: 'npm',
          maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }],
          totalPaid: 110000
        }
      ]
    })
})

test('GET `/organization/get-donation-ledger` 200 success | org has publically give set to true', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(false)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-donation-ledger',
    query: {
      organizationId: t.context.orgId2
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload),
    {
      success: true,
      ledger: [
        {
          id: t.context.packageId1,
          name: 'yttrium-server',
          registry: 'npm',
          maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }],
          totalPaid: 10000
        }
      ]
    })
})

test('GET `/organization/get-donation-ledger` 500 server error', async (t) => {
  t.context.db.organization.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-donation-ledger',
    query: {
      organizationId: t.context.orgId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithPublicDonations}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
