const test = require('ava')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')
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
  const { db, auth } = t.context

  const { registrationToken } = await auth.user.beginRegistration({ email: 'email@asdf.com' })
  auth.isRecaptchaResponseValid = () => true

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email: 'email@asdf.com', token: registrationToken, recaptchaResponse: 'big messy' }
  })

  const user = await db.user.getByEmail({ email: 'email@asdf.com' })

  t.true(res.headers['set-cookie'].includes(USER_WEB_SESSION_COOKIE))
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    user: {
      username: user.email,
      billingInfo: user.billingInfo,
      id: user.id.toString(),
      email: user.email
    }
  })
  t.true(user.apiKey.length > 0)
  t.is(user.username, user.email)

  const apiKeyInfo = await auth.user.getApiKey({ apiKey: user.apiKey })
  t.is(apiKeyInfo.id, user.id.toString())
})

test('POST `/user/verify-registration` 200 success | with referral code', async (t) => {
  const { db, auth } = t.context

  const { registrationToken } = await auth.user.beginRegistration({ email: 'email_ref@asdf.com', referralCode: 'papajohn' })
  auth.isRecaptchaResponseValid = () => true

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email: 'email_ref@asdf.com', token: registrationToken, recaptchaResponse: 'big messy' }
  })

  const user = await db.user.getByEmail({ email: 'email_ref@asdf.com' })

  t.true(res.headers['set-cookie'].includes(USER_WEB_SESSION_COOKIE))
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    user: {
      username: user.email,
      billingInfo: user.billingInfo,
      id: user.id.toString(),
      email: user.email
    }
  })
  t.true(user.apiKey.length > 0)
  t.is(user.referralCode, 'papajohn')
  t.is(user.username, user.email)

  const apiKeyInfo = await auth.user.getApiKey({ apiKey: user.apiKey })
  t.is(apiKeyInfo.id, user.id.toString())
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
