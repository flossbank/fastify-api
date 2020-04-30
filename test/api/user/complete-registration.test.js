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

test('POST `/user/complete-registration` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'email', response: 'response' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/complete-registration` 200 success', async (t) => {
  const { auth } = t.context
  const { pollingToken } = await auth.user.beginRegistration({ email: 'peter@quo.cc' })
  await auth.user.updateRegistrationApiKey({ email: 'peter@quo.cc', apiKey: 'asdf' })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'PETER@quo.cc', pollingToken }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload, { success: true, apiKey: 'asdf' })
})

test('POST `/user/complete-registration` 404 registration incomplete', async (t) => {
  const { auth } = t.context
  const { pollingToken } = await auth.user.beginRegistration({ email: 'joseph@quo.cc' })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'joseph@quo.cc', pollingToken }
  })
  t.deepEqual(res.statusCode, 404)
})

test('POST `/user/complete-registration` 500 server error', async (t) => {
  t.context.auth.user.completeRegistration = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'peter@quo.cc', pollingToken: 'token' }
  })
  t.deepEqual(res.statusCode, 500)
})
