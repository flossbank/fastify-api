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

test('POST `/package/update` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const pkgId1 = (await t.context.db.createPackage({
    name: 'yttrium-server',
    registry: 'npm',
    totalRevenue: 10,
    owner: t.context.maintainerId1,
    maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: pkgId1,
      package: {
        maintainers: [
          { maintainerId: t.context.maintainerId1, revenuePercent: 75 },
          { maintainerId: t.context.maintainerId2, revenuePercent: 15 }
        ],
        owner: t.context.maintainerId1
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/package/update` 200 success', async (t) => {
  const pkgId1 = (await t.context.db.createPackage({
    name: 'yttrium-server',
    registry: 'npm',
    totalRevenue: 10,
    owner: t.context.maintainerId1,
    maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: pkgId1,
      package: {
        maintainers: [
          { maintainerId: t.context.maintainerId1, revenuePercent: 75 },
          { maintainerId: t.context.maintainerId2, revenuePercent: 15 }
        ],
        owner: t.context.maintainerId1
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const pkg = await t.context.db.getPackage(pkgId1)
  t.deepEqual(pkg.maintainers, [
    { maintainerId: t.context.maintainerId1, revenuePercent: 75 },
    { maintainerId: t.context.maintainerId2, revenuePercent: 15 }
  ])
})

test('POST `/package/update` 400 bad request | not a pkg', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: '000000000000',
      package: {
        maintainers: [
          { maintainerId: 'test-maintainer-0', revenuePercent: 100 }
        ],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/update` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: { packageId: 'test-package-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: []
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: [{}],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: [{ maintainerId: 'test-maintainer-0', revenuePercent: 105 }],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/update` 500 server error', async (t) => {
  t.context.db.getPackage = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: [
          { maintainerId: 'test-maintainer-0', revenuePercent: 100 }
        ],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
