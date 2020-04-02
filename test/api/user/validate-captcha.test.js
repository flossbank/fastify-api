const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, () => {})
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

test('POST `/user/validate-captcha` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/validate-captcha',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/validate-captcha',
    payload: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/validate-captcha',
    payload: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/validate-captcha',
    payload: { email: 'email', response: 'response' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/validate-captcha` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/validate-captcha',
    payload: { email: 'PETER@quo.cc', token: 'token', response: 'response' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    apiKey: await t.context.auth.getOrCreateApiKey()
  })

  t.is((await t.context.db.getUserByEmail('peter@quo.cc')).apiKey, 'api-key')
})

test('POST `/user/validate-captcha` 200 success | existing user', async (t) => {
  const existingUser = { email: 'papi@gmail.co', apiKey: 'ff', billingInfo: {} }
  existingUser.id = await t.context.db.createUser(existingUser)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/validate-captcha',
    payload: { email: 'papi@gmail.co', token: 'token', response: 'response' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    apiKey: await t.context.auth.getOrCreateApiKey()
  })

  const user = await t.context.db.getUserByEmail('papi@gmail.co')
  t.deepEqual(user, existingUser) // user wasn't touched
})

test('POST `/user/validate-captcha` 401 unauthorized', async (t) => {
  t.context.auth.validateCaptcha.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/validate-captcha',
    payload: { email: 'peter@quo.cc', token: 'token', response: 'response' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/validate-captcha` 500 server error', async (t) => {
  t.context.auth.validateCaptcha.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/validate-captcha',
    payload: { email: 'peter@quo.cc', token: 'token', response: 'response' }
  })
  t.deepEqual(res.statusCode, 500)
})
