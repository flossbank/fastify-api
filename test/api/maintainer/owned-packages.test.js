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
    amount: 10.0,
    timestamp: 1590384893780
  }
]
const mockDonationRevenue = [
  {
    organizationId: '5f408f7f7311b720f775e162',
    amount: 37312.26185483995,
    timestamp: 1598475250862
  },
  {
    userId: '5f408f7f7311b720f775e165',
    amount: 20,
    timestamp: 1598475250810
  }
]

const formatPackages = (pkgs) => {
  return pkgs.map((pkg) => {
    delete pkg.maintainers
    delete pkg.avatarUrl
    pkg.donationRevenue = pkg.donationRevenue ? pkg.donationRevenue.reduce((a, r) => a + r.amount, 0) : 0
    pkg.adRevenue = pkg.adRevenue ? pkg.adRevenue.reduce((a, r) => a + r.amount, 0) : 0
    return pkg
  })
}

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session1 = session1.sessionId

    // user with no packages
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
    await db.package.update({
      packageId: yttriumId,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }]
    })

    await db.db.collection('packages').updateOne({
      _id: ObjectId(yttriumId)
    }, {
      $set: {
        adRevenue: mockAdRevenue,
        donationRevenue: mockDonationRevenue
      }
    })

    // pkg maintained only by user id 1 (different lang/reg than the first)
    const { id: sodium } = await db.package.create({
      name: 'sodium',
      registry: 'rubygems',
      language: 'ruby'
    })
    await db.package.update({
      packageId: sodium,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }]
    })

    // pkg maintained by user id 1 and 2
    const { id: papajohns } = await db.package.create({
      name: 'papajohns',
      registry: 'npm',
      language: 'javascript'
    })
    await db.package.update({
      packageId: papajohns,
      maintainers: [
        { userId: t.context.userId3, revenuePercent: 50 },
        { userId: t.context.userId1, revenuePercent: 50 }
      ]
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

test('GET `/maintainer/owned-packages` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/owned-packages` 200 success | all packages', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })

  let pkgs = await t.context.db.package.getOwnedPackages({ userId: t.context.userId1 })
  pkgs = formatPackages(pkgs)

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: pkgs
  })
})

test('GET `/maintainer/owned-packages` 200 success | filtered', async (t) => {
  // only npm please
  let res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    query: { registry: 'npm' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })

  let pkgs = await t.context.db.package.getOwnedPackages({ userId: t.context.userId1, registry: 'npm' })
  pkgs = formatPackages(pkgs)

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: pkgs
  })

  // only c++ please
  res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    query: { language: 'ruby' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })

  pkgs = await t.context.db.package.getOwnedPackages({ userId: t.context.userId1, language: 'ruby' })
  pkgs = formatPackages(pkgs)

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: pkgs
  })
})

test('GET `/maintainer/owned-packages` 400 bad request | invalid reg/lang', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    query: { registry: 'garbage' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/maintainer/owned-packages` 200 success | nothing to see here', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session2}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: []
  })
})

test('GET `/maintainer/owned-packages` 500 server error', async (t) => {
  t.context.db.package.getOwnedPackages = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
