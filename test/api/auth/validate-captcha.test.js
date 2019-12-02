const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/auth/validate-captcha` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/validate-captcha',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/validate-captcha',
    payload: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/validate-captcha',
    payload: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/validate-captcha',
    payload: { email: 'email', response: 'response' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/auth/validate-captcha` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/validate-captcha',
    payload: { email: 'peter@quo.cc', token: 'token', response: 'response' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    apiKey: await t.context.auth.validateCaptcha()
  })
})

test('POST `/auth/validate-captcha` 401 unauthorized', async (t) => {
  t.context.auth.validateCaptcha.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/validate-captcha',
    payload: { email: 'peter@quo.cc', token: 'token', response: 'response' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/auth/validate-captcha` 500 server error', async (t) => {
  t.context.auth.validateCaptcha.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/validate-captcha',
    payload: { email: 'peter@quo.cc', token: 'token', response: 'response' }
  })
  t.deepEqual(res.statusCode, 500)
})
