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

test('POST `/ad-campaign/create` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: t.context.advertiserId1,
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain 1'
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
      advertiserId: t.context.advertiserId1,
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain 2'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const campaign = await t.context.db.getAdCampaign(id)
  t.deepEqual(campaign.advertiserId, t.context.advertiserId1)
})

test('POST `/ad-campaign/create` 400 bad request | no advertiser', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      advertiserId: '000000000000',
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain 3'
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
  t.context.db.createAdCampaign = () => { throw new Error() }
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
