const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId1 = advertiserId1.toHexString()
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('POST `/ad/create` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      ad: {
        name: 'ad',
        advertiserId: t.context.advertiserId1,
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
        advertiserId: t.context.advertiserId1,
        content: { body: 'abc', title: 'abc', url: 'abc' }
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const ad = await t.context.db.getAd(id)
  t.deepEqual(ad.advertiserId, t.context.advertiserId1)
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

test('POST `/ad/create` 400 bad request | invalid advertiser id', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      ad: {
        name: 'ad',
        advertiserId: '000000000000',
        content: { body: 'abc', title: 'abc', url: 'abc' }
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad/create` 500 server error', async (t) => {
  t.context.db.getAdvertiser = () => { throw new Error() }
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
