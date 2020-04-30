const test = require('ava')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id } = await db.createUser({ email: 'honey@etsy.com' })
    t.context.userId = id.toHexString()
    const { token } = await auth.user.beginAuthentication({ userId: t.context.userId })
    t.context.token = token
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

test('POST `/user/complete-login` 401 unauthorized | bad token', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-login',
    body: { email: 'honey@etsy.com', token: 'bad toke' }
  })
  t.is(res.statusCode, 401)
})

test('POST `/user/complete-login` 404 invalid user', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-login',
    body: { email: 'fogler@folgers.coffee', token: 'coffeesnobdoorknob' }
  })
  t.is(res.statusCode, 404)
})

test('POST `/user/complete-login` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-login',
    body: { email: 'HONEY@etsy.com', token: t.context.token }
  })
  t.is(res.statusCode, 200)
  t.true(res.headers['set-cookie'].includes(USER_WEB_SESSION_COOKIE))

  const payload = JSON.parse(res.payload)
  t.is(payload.success, true)
  t.is(payload.user.email, 'honey@etsy.com')
})

test('POST `/user/complete-login` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-login',
    body: {}
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-login',
    body: { email: 'email@asdf.com' }
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-login',
    body: { token: 'token' }
  })
  t.is(res.statusCode, 400)
})

test('POST `/user/complete-login` 500 server error', async (t) => {
  t.context.db.getUserByEmail = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-login',
    body: { email: 'test@test.com', token: 'toke' }
  })
  t.is(res.statusCode, 500)
})
