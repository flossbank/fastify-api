const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/advertiser/verify` 401 unauthorized', async (t) => {
  t.context.auth.validateUserToken.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/verify` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/advertiser/verify` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { token: 'token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/verify` 500 server error', async (t) => {
  t.context.db.verifyAdvertiser.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 500)
})
