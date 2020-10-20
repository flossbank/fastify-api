const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const email = 'honey@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()

    const session = await auth.user.createWebSession({ userId: t.context.userId1 })
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

test('POST `/organization/github-create` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: 'abc' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/organization/github-create` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: 'abc' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)
})

test('POST `/organization/github-create` 400 error | installation id not provided', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test.skip('POST `/organization/github-create` 400 error | installation id is bad', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: 'abc' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test.skip('POST `/organization/github-create` 500 server error', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: 'abc' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
