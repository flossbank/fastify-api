const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('POST `/ad-campaign/create` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: 'test-advertiser-0',
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/create` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: 'test-advertiser-0',
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    id: await t.context.db.createAdCampaign()
  })
})

test('POST `/ad-campaign/create` 400 bad request | no advertiser', async (t) => {
  t.context.db.getAdvertiser.resolves() // no advertiser
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: 'test-advertiser-0',
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/create` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: 'test-advertiser-0',
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: 'test-advertiser-0',
      ads: [],
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: 'test-advertiser-0',
      ads: [],
      maxSpend: 1000,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: 'test-advertiser-0',
      ads: [],
      maxSpend: 1000,
      cpm: 100
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/create` 500 server error', async (t) => {
  t.context.db.createAdCampaign.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: 'test-advertiser-0',
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
