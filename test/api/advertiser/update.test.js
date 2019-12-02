const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('POST `/advertiser/update` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update',
    payload: {
      advertiser: {
        id: 'test-advertiser-0',
        organization: 'ad org'
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/update` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update',
    payload: {
      advertiser: {
        id: 'test-advertiser-0',
        organization: 'ad org'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/advertiser/update` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update',
    payload: { advertiser: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/update` 500 server error', async (t) => {
  t.context.db.updateAdvertiser.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update',
    payload: { advertiser: { id: 'test-advertiser-0' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
