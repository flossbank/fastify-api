const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { MAINTAINER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const maintainerId1 = await db.createMaintainer({
      maintainer: {
        name: 'Pete',
        email: 'pete@flossbank.com',
        password: 'petespass'
      }
    })
    t.context.maintainerId1 = maintainerId1.toHexString()
    t.context.sessionId1 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId1 })

    const maintainerId2 = await db.createMaintainer({
      maintainer: {
        name: 'Goelle',
        email: 'goelle@flossbank.com',
        password: 'cami42069'
      }
    })
    t.context.maintainerId2 = maintainerId2.toHexString()
    t.context.sessionId2 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId2 })

    await db.createPackage({
      pkg: {
        name: 'yttrium-server',
        registry: 'npm',
        totalRevenue: 10,
        owner: t.context.maintainerId1,
        maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
      }
    })

    await db.createPackage({
      pkg: {
        name: 'js-deep-equals',
        registry: 'npm',
        totalRevenue: 10,
        owner: t.context.maintainerId1,
        maintainers: [
          { maintainerId: t.context.maintainerId1, revenuePercent: 50 },
          { maintainerId: t.context.maintainerId2, revenuePercent: 50 }
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

test.after(async (t) => {
  await after(t)
})

test('GET `/maintainer/revenue` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: { maintainerId: t.context.maintainerId1 },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/revenue` 200 success | maint1', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    revenue: 15
  })
})

test('GET `/maintainer/revenue` 200 success | maint2', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    revenue: 5
  })
})

test('GET `/maintainer/revenue` 200 success | nobody', async (t) => {
  const sessionId = await t.context.auth.maintainer.createWebSession({ maintainerId: '000000000000' })
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    revenue: 0
  })
})

test('GET `/maintainer/revenue` 500 server error', async (t) => {
  t.context.db.getRevenue = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
