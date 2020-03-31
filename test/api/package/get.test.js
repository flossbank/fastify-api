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

    const pkgId1 = await db.createPackage({
      name: 'yttrium-server',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId1,
      maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
    })
    t.context.pkgId1 = pkgId1.toHexString()
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

test('GET `/package/get` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    query: { maintainerId: t.context.maintainerId1 },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/package/get` 200 success', async (t) => {
  t.context.auth.getUISession.resolves({ maintainerId: t.context.maintainerId1 })
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: [
      {
        id: t.context.pkgId1,
        name: 'yttrium-server',
        registry: 'npm',
        totalRevenue: 10,
        owner: t.context.maintainerId1,
        maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
      }
    ]
  })
})

test('GET `/package/get` 500 server error', async (t) => {
  t.context.db.getOwnedPackages = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    query: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
