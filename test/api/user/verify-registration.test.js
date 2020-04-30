const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t)
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

test('POST `/user/verify-registration` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email: 'email@asdf.com' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { token: 'token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/verify-registration` 200 success', async (t) => {
  const { registrationToken } = await t.context.auth.user.beginRegistration({ email: 'email@asdf.com' })
  t.context.auth.isRecaptchaResponseValid = () => true

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email: 'email@asdf.com', token: registrationToken, recaptchaResponse: 'big messy' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/user/verify-registration` 401 unauthorized', async (t) => {
  await t.context.auth.user.beginRegistration({ email: 'email2@asdf.com' })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email: 'email2@asdf.com', token: 'token', recaptchaResponse: 'big messy' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/verify-registration` 500 server error', async (t) => {
  t.context.auth.user.validateRegistration = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email: 'email@asdf.com', token: 'token', recaptchaResponse: 'big messy' }
  })
  t.deepEqual(res.statusCode, 500)
})
