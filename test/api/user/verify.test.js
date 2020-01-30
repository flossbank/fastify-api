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

test('POST `/user/verify` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify',
    payload: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify',
    payload: { token: 'token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/verify` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify',
    payload: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/user/verify` 401 unauthorized', async (t) => {
  t.context.auth.validateUserToken.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify',
    payload: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/verify` 500 server error', async (t) => {
  t.context.auth.validateUserToken.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/verify',
    payload: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 500)
})
