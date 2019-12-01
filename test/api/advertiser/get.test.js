const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('GET `/advertiser/get` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    query: { advertiserId: 'test-advertiser-0' },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/advertiser/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    query: { advertiserId: 'test-advertiser-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    advertiser: await t.context.db.getAdvertiser()
  })
})

test('GET `/advertiser/get` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    query: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/advertiser/get` 500 server error', async (t) => {
  t.context.db.getAdvertiser.throws()
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    query: { advertiserId: 'test-advertiser-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
