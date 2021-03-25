const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { REGISTRIES: { NPM }, LANGUAGES: { JAVASCRIPT }, USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'pete@flossbank.com' })
    t.context.userId1 = userId1.toHexString()
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionId1 = session1.sessionId

    const { id: userId2 } = await db.user.create({ email: 'goelle@flossbank.com' })
    t.context.userId2 = userId2.toHexString()
    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.sessionId2 = session2.sessionId

    const { id: pid1 } = await db.package.create({
      name: 'moonbase',
      registry: NPM,
      language: JAVASCRIPT
    })
    await db.package.update({
      packageId: pid1,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 90, source: 'registry' },
        { userId: t.context.userId2, revenuePercent: 10, source: 'invite' }
      ]
    })
    t.context.moonbaseId = pid1.toString()
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

test('PUT `/package/maintainer-revenue-share` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/maintainer-revenue-share',
    payload: {
      packageId: t.context.moonbaseId,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 75 },
        { userId: t.context.userId2, revenuePercent: 25 }
      ]
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('PUT `/package/maintainer-revenue-share` 404 | non-existant package', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/maintainer-revenue-share',
    payload: {
      packageId: 'aaaaaaaaaaaa',
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 75 },
        { userId: t.context.userId2, revenuePercent: 25 }
      ]
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('PUT `/package/maintainer-revenue-share` 400 | percentages dont add up to 100', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/maintainer-revenue-share',
    payload: {
      packageId: t.context.moonbaseId,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 75 },
        { userId: t.context.userId2, revenuePercent: 15 }
      ]
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('PUT `/package/maintainer-revenue-share` 401 | non-owner attempting an update', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/maintainer-revenue-share',
    payload: {
      packageId: t.context.moonbaseId,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 75 },
        { userId: t.context.userId2, revenuePercent: 25 }
      ]
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('PUT `/package/maintainer-revenue-share` 400 | maintainer lists dont match | length', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/maintainer-revenue-share',
    payload: {
      packageId: t.context.moonbaseId,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 100 }
      ]
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('PUT `/package/maintainer-revenue-share` 400 | maintainer lists dont match | userIds are diff', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/maintainer-revenue-share',
    payload: {
      packageId: t.context.moonbaseId,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 75 },
        { userId: 'cccccccccccc', revenuePercent: 25 }
      ]
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('PUT `/package/maintainer-revenue-share` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/maintainer-revenue-share',
    payload: {
      packageId: t.context.moonbaseId,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 50 },
        { userId: t.context.userId2, revenuePercent: 50 }
      ]
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  // All fields aside from revenue percent should stay the same
  const pkg = await t.context.db.package.get({ packageId: t.context.moonbaseId })
  t.deepEqual(pkg.maintainers, [
    { userId: t.context.userId1, revenuePercent: 50, source: 'registry' },
    { userId: t.context.userId2, revenuePercent: 50, source: 'invite' }
  ])
})

test('PUT `/package/maintainer-revenue-share` 500 server error', async (t) => {
  t.context.db.package.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/maintainer-revenue-share',
    payload: {
      packageId: '000000000000',
      maintainers: [
        { userId: 'test-maintainer-0', revenuePercent: 100 }
      ]
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
