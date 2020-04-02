const test = require('ava')
const { USER_SESSION_KEY } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    await db.createUser({ email: 'honey@etsy.com', apiKey: 'ff', billingInfo: {} })
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

test('POST `/user/authenticate` 401 unauthorized | bad token', async (t) => {
  t.context.auth.validateToken.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/authenticate',
    body: { email: 'honey@etsy.com', token: 'bad toke' }
  })
  t.is(res.statusCode, 401)
})

test('POST `/user/authenticate` 500 valid token / invalid user', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/authenticate',
    body: { email: 'fogler@folgers.coffee', token: 'coffeesnobdoorknob' }
  })
  t.is(res.statusCode, 500)
})

test('POST `/user/authenticate` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/authenticate',
    body: { email: 'HONEY@etsy.com', token: 'totes valid' }
  })
  t.is(res.statusCode, 200)
  t.is(res.headers['set-cookie'], `${USER_SESSION_KEY}=user-session; Path=/`)
  const payload = JSON.parse(res.payload)
  t.is(payload.success, true)
  t.is(payload.user.email, 'honey@etsy.com')
})

test('POST `/user/authenticate` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/authenticate',
    body: {}
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/authenticate',
    body: { email: 'email@asdf.com' }
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/authenticate',
    body: { token: 'token' }
  })
  t.is(res.statusCode, 400)
})

test('POST `/user/authenticate` 500 server error', async (t) => {
  t.context.db.validateToken = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/authenticate',
    body: { email: 'test@test.com', token: 'toke' }
  })
  t.is(res.statusCode, 500)
})
