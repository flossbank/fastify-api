const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const maintainerId1 = await db.createMaintainer({
      name: 'Pete',
      email: 'pete@flossbank.com',
      password: 'petespass'
    })
    t.context.maintainerId1 = maintainerId1.toHexString()

    const maintainerId2 = await db.createMaintainer({
      name: 'Goelle',
      email: 'goelle@flossbank.com',
      password: 'cami42069'
    })
    t.context.maintainerId2 = maintainerId2.toHexString()

    await db.createPackage({
      name: 'yttrium-server',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId1,
      maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
    })

    await db.createPackage({
      name: 'js-deep-equals',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId1,
      maintainers: [
        { maintainerId: t.context.maintainerId1, revenuePercent: 50 },
        { maintainerId: t.context.maintainerId2, revenuePercent: 50 }
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

test.after(async (t) => {
  await after(t)
})

test('GET `/maintainer/revenue` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: { maintainerId: t.context.maintainerId1 },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/revenue` 200 success | maint1', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: { maintainerId: t.context.maintainerId1 },
    headers: { authorization: 'valid-session-token' }
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
    query: { maintainerId: t.context.maintainerId2 },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    revenue: 5
  })
})

test('GET `/maintainer/revenue` 200 success | nobody', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: { maintainerId: '000000000000' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    revenue: 0
  })
})

test('GET `/maintainer/revenue` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/maintainer/revenue` 500 server error', async (t) => {
  t.context.db.getRevenue = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
