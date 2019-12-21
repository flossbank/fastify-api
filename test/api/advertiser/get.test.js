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
    await db.verifyAdvertiser('honey@etsy.com')

    const unverifiedAdvertiserId = await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    })
    t.context.unverifiedAdvertiserId = unverifiedAdvertiserId.toHexString()
  })
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

test('GET `/advertiser/get` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    query: { advertiserId: t.context.advertiserId1 },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/advertiser/get` 400 | unverified', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    query: { advertiserId: t.context.unverifiedAdvertiserId },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/advertiser/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    query: { advertiserId: t.context.advertiserId1 },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    advertiser: {
      id: t.context.advertiserId1,
      name: 'Honesty',
      email: 'honey@etsy.com',
      adCampaigns: [],
      verified: true,
      active: true
    }
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
  t.context.db.getAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    query: { advertiserId: 'test-advertiser-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
