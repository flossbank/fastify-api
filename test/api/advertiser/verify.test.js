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

test('POST `/advertiser/verify` 401 unauthorized', async (t) => {
  await t.context.db.createAdvertiser({
    name: 'Honesty',
    email: 'honey1@etsy.com',
    password: 'beekeeperbookkeeper'
  })
  t.context.auth.validateToken.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'honey1@etsy.com', token: 'token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/verify` 200 success', async (t) => {
  const advertiserId = (await t.context.db.createAdvertiser({
    name: 'Honesty',
    email: 'honey2@etsy.com',
    password: 'beekeeperbookkeeper'
  })).toHexString()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'honey2@etsy.com', token: 'token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.getAdvertiser(advertiserId)
  t.true(advertiser.verified)
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
  t.context.db.verifyAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'email', token: 'token' }
  })
  t.deepEqual(res.statusCode, 500)
})
