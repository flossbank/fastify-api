const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('POST `/ad/create` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      ad: {
        name: 'ad',
        advertiserId: 'advertiser-id',
        content: { body: 'abc', title: 'abc', url: 'abc' }
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad/create` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      ad: {
        name: 'ad',
        advertiserId: 'advertiser-id',
        content: { body: 'abc', title: 'abc', url: 'abc' }
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    id: await t.context.db.createAd()
  })
})

test('POST `/ad/create` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: { ad: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: { ad: { advertiserId: 'advertiserId' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: { ad: { advertiserId: 'advertiserId', content: {} } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: { ad: { advertiserId: 'advertiserId', content: {}, name: 'ad' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      ad: {
        name: 'ad',
        advertiserId: 'advertiserId',
        content: {
          title: 'abc'
        }
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      ad: {
        name: 'ad',
        advertiserId: 'advertiserId',
        content: {
          title: 'abc',
          body: 'abc'
        }
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad/create` 500 server error', async (t) => {
  t.context.db.createAd.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      ad: {
        name: 'ad',
        advertiserId: 'advertiserId',
        content: {
          title: 'abc',
          body: 'abc',
          url: 'abc'
        }
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
