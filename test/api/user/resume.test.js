const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId = userId1.toHexString()
    const session = await auth.user.createWebSession({ userId: t.context.userId })
    t.context.sessionId = session.sessionId
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

test('GET `/user/resume` 401 unauthorized | no session', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/resume',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/user/resume` 200 | success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/resume',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.success, true)
  const userRetrieved = await t.context.db.user.get({
    userId: t.context.userId
  })
  t.deepEqual(payload.user, {
    id: userRetrieved.id.toHexString(),
    billingInfo: userRetrieved.billingInfo,
    email: userRetrieved.email
  })
})

test('GET `/user/resume` 400 | no user', async (t) => {
  t.context.db.user.get = () => undefined
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/resume',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/user/resume` 500 | user query error', async (t) => {
  t.context.db.user.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/resume',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
