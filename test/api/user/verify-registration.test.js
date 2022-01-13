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
  const email = 'email@asdf.com'

  const { registrationToken } = await auth.user.beginRegistration({ email })
  auth.isRecaptchaResponseValid = () => true

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email, token: registrationToken, recaptchaResponse: 'big messy' }
  })

  const user = await db.user.getByEmail({ email })

  t.deepEqual(user.username, email)
  t.true(res.headers['set-cookie'].includes(USER_WEB_SESSION_COOKIE))
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    user: {
      username: email,
      billingInfo: user.billingInfo,
      id: user.id.toString(),
      email: user.email
    }
  })
  t.true(user.apiKey.length > 0)

  const apiKeyInfo = await auth.user.getApiKey({ apiKey: user.apiKey })
  t.is(apiKeyInfo.id, user.id.toString())
})

test('POST `/user/verify-registration` 200 success | with referral code', async (t) => {
  const { db, auth } = t.context
  const email = 'email_ref@asdf.com'

  const { registrationToken } = await auth.user.beginRegistration({ email, referralCode: 'papajohn' })
  auth.isRecaptchaResponseValid = () => true

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email, token: registrationToken, recaptchaResponse: 'big messy' }
  })

  const user = await db.user.getByEmail({ email })

  t.deepEqual(user.username, email)
  t.true(res.headers['set-cookie'].includes(USER_WEB_SESSION_COOKIE))
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    user: {
      username: email,
      billingInfo: user.billingInfo,
      id: user.id.toString(),
      email: user.email
    }
  })
  t.true(user.apiKey.length > 0)
  t.is(user.referralCode, 'papajohn')

  const apiKeyInfo = await auth.user.getApiKey({ apiKey: user.apiKey })
  t.is(apiKeyInfo.id, user.id.toString())
})

test('POST `/user/verify-registration` 200 success | multiple sign ups', async (t) => {
  const { auth } = t.context
  const emails = ['email1@asdf.com', 'email2@asdf.com']

  let { registrationToken } = await auth.user.beginRegistration({ email: emails[0] })
  auth.isRecaptchaResponseValid = () => true

  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email: emails[0], token: registrationToken, recaptchaResponse: 'big messy' }
  })

  t.deepEqual(res.statusCode, 200)

  const registration = await auth.user.beginRegistration({ email: emails[1] })
  registrationToken = registration.registrationToken
  auth.isRecaptchaResponseValid = () => true

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify-registration',
    payload: { email: emails[1], token: registrationToken, recaptchaResponse: 'big messy' }
  })

  t.deepEqual(res.statusCode, 200)
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
