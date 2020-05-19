const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()

    t.context.sessionId1 = await auth.user.createWebSession({ userId: t.context.userId1 })
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

test('POST `/user/new-install` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/new-install',
    payload: { billingToken: 'new-stripe-token', last4: '1234' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/new-install` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/new-install',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.is(payload.success, true)
  t.true(payload.token.length > 0)

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.is(user.apiKeysRequested.length, 1)
})

test('POST `/user/new-install` 500 server error', async (t) => {
  t.context.db.user.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/new-install',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
