const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../../_helpers/_setup')
const { REGISTRIES: { NPM }, USER_WEB_SESSION_COOKIE } = require('../../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const email = 'honey@etsy.com'
    const { id: userId } = await db.user.create({ email })
    t.context.userId = userId.toHexString()

    const session = await auth.user.createWebSession({ userId: t.context.userId })
    t.context.session = session.sessionId
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

test('POST `/package/npm/ownership` 401 unauthorized | middleware', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/npm/ownership',
    payload: {
      readOnlyToken: 'blahblahblah'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

// tests covering the nuances of db.package.refreshPackages should be in api/package/npm/refresh-ownership
test('POST `/package/npm/ownership` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/npm/ownership',
    payload: {
      readOnlyToken: 'blahblahblah'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)

  const { registry, userId } = t.context
  const { npm } = registry
  t.true(npm.getUsername.calledOnce)
  t.true(npm.getOwnedPackages.calledOnce)

  const packages = await t.context.db.package.getOwnedPackages({ userId, registry: NPM })
  t.is(packages.length, 2)
  t.deepEqual(
    packages.map(({ name, maintainers }) => ({ name, maintainers })),
    (await npm.getOwnedPackages()).map((pkg) => ({
      name: pkg,
      maintainers: [{
        maintainerId: userId,
        revenuePercent: 100
      }]
    })))
})

test('POST `/package/npm/ownership` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/npm/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/npm/ownership` 500 server error', async (t) => {
  t.context.registry.npm.getUsername = () => { throw new Error('oh no!') }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/npm/ownership',
    payload: {
      readOnlyToken: 'blahblahblah'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
