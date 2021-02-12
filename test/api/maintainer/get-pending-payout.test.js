const test = require('ava')
const { ObjectId } = require('mongodb')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

const mockAdRevenue = [
  {
    userId: '5e83c1fe40e84654d6c75bd5',
    sessionId: 'd75ece87dd33ff87cd261e672c1092902999f8652eb9a3c9f76d4d81b24e299a',
    amount: 0.25,
    timestamp: 1590384893790
  },
  {
    userId: '5e83c1fe40e84654d6c75bf5',
    sessionId: 'd75ece87dd33ff87cd261e672c1092902999f8652eb9a3c9f76d4d81b24e299a',
    amount: 100.0,
    timestamp: 1590384893780
  }
]
const mockDonationRevenue = [
  {
    organizationId: '5f408f7f7311b720f775e162',
    amount: 100000,
    timestamp: 1598475250862
  },
  {
    organizationId: '5f408f7f7311b720f775e162',
    amount: 10000,
    paid: true,
    timestamp: 1598475250862
  },
  {
    userId: '5f408f7f7311b720f775e165',
    amount: 200000,
    timestamp: 1598475250810
  }
]

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session1 = session1.sessionId

    // user with no payout
    const { id: userId2 } = await db.user.create({ email: 'bear@etsy.com' })
    t.context.userId2 = userId2.toHexString()
    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.session2 = session2.sessionId

    // user co-maintaining a pkg
    const { id: userId3 } = await db.user.create({ email: 'robin@etsy.com' })
    t.context.userId3 = userId3.toHexString()
    const session3 = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.session3 = session3.sessionId

    // pkg maintained only by user id 1
    const { id: yttriumId } = await db.package.create({
      name: 'yttrium-server',
      registry: 'npm',
      language: 'javascript'
    })

    await db.db.collection('packages').updateOne({
      _id: ObjectId(yttriumId)
    }, {
      $set: {
        adRevenue: mockAdRevenue,
        donationRevenue: mockDonationRevenue,
        maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }]
      }
    })

    // pkg maintained by user id 1 and 2
    const { id: papajohns } = await db.package.create({
      name: 'papajohns',
      registry: 'npm',
      language: 'javascript'
    })

    await db.db.collection('packages').updateOne({
      _id: ObjectId(papajohns)
    }, {
      $set: {
        adRevenue: mockAdRevenue,
        donationRevenue: mockDonationRevenue,
        maintainers: [
          { userId: t.context.userId3, revenuePercent: 50 },
          { userId: t.context.userId1, revenuePercent: 50 }
        ]
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

test('GET `/maintainer/pending-payout` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/pending-payout` 200 success | maintainer who owns 100% and 50%', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    payout: (300100.25 * 3 / 2 / 100000).toFixed(1)
  })
})

test('GET `/maintainer/pending-payout` 200 success | maintainer who no packages', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session2}`
    }
  })

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    payout: 0
  })
})

test('GET `/maintainer/pending-payout` 200 success | maintainer with split package', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session3}`
    }
  })

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    payout: (300100.25 / 2 / 100000).toFixed(1)
  })
})

test('GET `/maintainer/pending-payout` 500 server error', async (t) => {
  t.context.db.maintainer.getPendingPayout = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
