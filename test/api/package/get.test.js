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
    const sessionId1 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId1 })
    t.context.sessionId1 = sessionId1.sessionId

    const pkgId1 = await db.package.create({
      pkg: {
        name: 'yttrium-server',
        registry: 'npm',
        owner: t.context.maintainerId1,
        maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
      }
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
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    query: { maintainerId: t.context.maintainerId1 },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`

    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/package/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: [
      {
        id: t.context.pkgId1,
        name: 'yttrium-server',
        registry: 'npm',
        owner: t.context.maintainerId1,
        maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
      }
    ]
  })
})

test('GET `/package/get` 500 server error', async (t) => {
  t.context.db.maintainer.getOwnedPackages = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    query: { maintainerId: 'test-maintainer-0' },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
