const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { MAINTAINER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const maintainerId1 = await db.maintainer.create({
      maintainer: {
        name: 'Pete',
        email: 'pete@flossbank.com',
        password: 'petespass'
      }
    })
    t.context.maintainerId1 = maintainerId1.toHexString()
    const session1 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId1 })
    t.context.sessionId1 = session1.sessionId

    const maintainerId2 = await db.maintainer.create({
      maintainer: {
        name: 'Goelle',
        email: 'goelle@flossbank.com',
        password: 'cami42069'
      }
    })
    t.context.maintainerId2 = maintainerId2.toHexString()
    const session2 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId2 })
    t.context.sessionId2 = session2.sessionId
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
  const pkgId1 = (await t.context.db.package.create({
    pkg: {
      name: 'yttrium-server',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId1,
      maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
    }
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: pkgId1,
      maintainers: [
        { maintainerId: t.context.maintainerId1, revenuePercent: 75 },
        { maintainerId: t.context.maintainerId2, revenuePercent: 15 }
      ],
      owner: t.context.maintainerId1
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/package/update` 401 unauthorized | non-owner', async (t) => {
  const pkgId1 = (await t.context.db.package.create({
    pkg: {
      name: 'yttrium-cli',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId1,
      maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
    }
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: pkgId1,
      maintainers: [
        { maintainerId: t.context.maintainerId1, revenuePercent: 75 },
        { maintainerId: t.context.maintainerId2, revenuePercent: 15 }
      ],
      owner: t.context.maintainerId1
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/package/update` 200 success', async (t) => {
  const pkgId1 = (await t.context.db.package.create({
    pkg: {
      name: 'yttrium-server',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId1,
      maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
    }
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: pkgId1,
      maintainers: [
        { maintainerId: t.context.maintainerId1, revenuePercent: 75 },
        { maintainerId: t.context.maintainerId2, revenuePercent: 15 }
      ],
      owner: t.context.maintainerId1
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const pkg = await t.context.db.package.get({ packageId: pkgId1 })
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
      maintainers: [
        { maintainerId: 'test-maintainer-0', revenuePercent: 100 }
      ],
      owner: 'test-maintainer-0'
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/update` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {},
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: { packageId: '000000000000' },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: '000000000000',
      maintainers: []
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: '000000000000',
      maintainers: [{}],
      owner: 'test-maintainer-0'
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: '000000000000',
      maintainers: [{ maintainerId: 'test-maintainer-0', revenuePercent: 105 }],
      owner: 'test-maintainer-0'
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/update` 500 server error', async (t) => {
  t.context.db.package.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: '000000000000',
      maintainers: [
        { maintainerId: 'test-maintainer-0', revenuePercent: 100 }
      ],
      owner: 'test-maintainer-0'
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
