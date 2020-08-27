const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
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

test('POST `/user/github-auth` 200 success | create new user', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.is(!!payload.user.id, true)
  t.is(payload.success, true)
  t.is(payload.created, true)

  const user = await t.context.db.user.get({ userId: payload.user.id })
  t.deepEqual(user.codeHost, { GitHub: { accessToken: 'test_access_token' } })
})

test('POST `/user/github-auth` 200 success | existing user', async (t) => {
  t.context.github.requestUserData.resolves({ email: 'honey@etsy.com' })
  const userBefore = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(userBefore.codeHost, undefined)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.is(!!payload.user.id, true)
  t.is(payload.success, true)
  t.is(payload.created, false)

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(user.codeHost, { GitHub: { accessToken: 'test_access_token' } })
})

test('POST `/user/github-auth` 400 bad request | no state', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/github-auth` 400 bad request | no code', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/github-auth` 500 server error', async (t) => {
  t.context.github.requestAccessToken.rejects('error!')
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 500)
})
