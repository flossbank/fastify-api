const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, () => {})
  sinon.stub(Date, 'now').returns(1234)
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
  Date.now.restore()
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
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'PETER@quo.cc', pollingToken: 'token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.is(payload.success, true)
  t.true(payload.apiKey.length > 0)
})

test('POST `/user/complete-registration` 404 not found', async (t) => {
  t.context.auth.user.completeRegistration.resolves()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'peter@quo.cc', pollingToken: 'token' }
  })
  t.deepEqual(res.statusCode, 404)
})

test('POST `/user/complete-registration` 500 server error', async (t) => {
  t.context.auth.user.completeRegistration.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-registration',
    payload: { email: 'peter@quo.cc', pollingToken: 'token' }
  })
  t.deepEqual(res.statusCode, 500)
})
