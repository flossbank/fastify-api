const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../../_helpers/_setup')
const { REGISTRIES: { RUBYGEMS }, LANGUAGES: { RUBY }, USER_WEB_SESSION_COOKIE } = require('../../../../helpers/constants')

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

test('POST `/package/rubygems/ownership` 401 unauthorized | middleware', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/rubygems/ownership',
    payload: {
      readOnlyToken: 'blahblahblah',
      username: 'stripedpajamas'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

// tests covering the nuances of db.package.refreshPackages should be in api/package/rubygems/refresh-ownership
test('POST `/package/rubygems/ownership` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/rubygems/ownership',
    payload: {
      readOnlyToken: 'blahblahblah',
      username: 'stripedpajamas'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)

  const { registry, userId } = t.context
  const { rubygems } = registry
  t.true(rubygems.tokenUsernameMatch.calledOnce)
  t.true(rubygems.getOwnedPackages.calledOnce)

  const packages = await t.context.db.package.getOwnedPackages({ userId, registry: RUBYGEMS, language: RUBY })
  t.is(packages.length, 2)
  t.deepEqual(
    packages.map(({ name, maintainers }) => ({ name, maintainers })),
    (await rubygems.getOwnedPackages()).map((pkg) => ({
      name: pkg,
      maintainers: [{
        userId,
        source: 'registry',
        revenuePercent: 100
      }]
    })))
})

test('POST `/package/rubygems/ownership` 403 token/username mismatch', async (t) => {
  t.context.registry.rubygems.tokenUsernameMatch.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/rubygems/ownership',
    payload: {
      readOnlyToken: 'blahblahblah',
      username: 'stripedpajamas'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 403)
})

test('POST `/package/rubygems/ownership` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/rubygems/ownership',
    payload: {
      readOnlyToken: 'blah'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  const res2 = await t.context.app.inject({
    method: 'POST',
    url: '/package/rubygems/ownership',
    payload: {
      username: 'blah'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res2.statusCode, 400)
})

test('POST `/package/rubygems/ownership` 500 server error', async (t) => {
  t.context.registry.rubygems.tokenUsernameMatch = () => { throw new Error('oh no!') }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/rubygems/ownership',
    payload: {
      readOnlyToken: 'blahblahblah',
      username: 'moshpit'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
