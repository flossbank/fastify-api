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

    const advertiserId2 = await db.createAdvertiser({
      name: 'Faith Ogler',
      email: 'fogler@folgers.coffee',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId2 = advertiserId2.toHexString()

    const adId1 = await db.createAd({
      name: 'ad #1',
      content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
      advertiserId: t.context.advertiserId1,
      active: false,
      approved: false
    })
    t.context.adId1 = adId1.toHexString()

    const adId2 = await db.createAd({
      name: 'ad #2',
      content: { body: 'def', title: 'DEF', url: 'https://def.com' },
      advertiserId: t.context.advertiserId2,
      active: false,
      approved: false
    })
    t.context.adId2 = adId2.toHexString()
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

test('GET `/ad/get-all` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/get-all',
    query: { advertiserId: t.context.advertiserId1 },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/ad/get-all` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/get-all',
    query: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/ad/get-all` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/get-all',
    query: { advertiserId: t.context.advertiserId1 },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: [{
      id: t.context.adId1,
      name: 'ad #1',
      content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
      advertiserId: t.context.advertiserId1,
      active: false,
      approved: false
    }]
  })
})

test('GET `/ad/get-all` 500 server error', async (t) => {
  t.context.db.getAdsByAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/get-all',
    query: { advertiserId: 'advertiser-id-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
