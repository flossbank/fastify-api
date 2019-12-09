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

test.failing('POST `/ad/update` 401 unauthorized', async (t) => {
  const adId = (await t.context.db.createAd({
    name: 'ad #1',
    content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
    advertiserId: t.context.advertiserId1,
    active: false,
    approved: false
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/update',
    payload: {
      adId,
      ad: {
        name: 'ad',
        content: { body: 'abc', title: 'abc', url: 'abc' }
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad/update` 200 success', async (t) => {
  const adId = (await t.context.db.createAd({
    name: 'ad #1',
    content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
    advertiserId: t.context.advertiserId1,
    active: false,
    approved: false
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/update',
    payload: {
      adId,
      ad: {
        name: 'new name',
        content: { body: 'abc', title: 'abc', url: 'abc' }
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
  const updatedAd = await t.context.db.getAd(adId)
  t.deepEqual(updatedAd.name, 'new name')
})

test('POST `/ad/update` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/update',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad/update` 500 server error', async (t) => {
  t.context.db.updateAd = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/update',
    payload: {
      adId: 'test-ad-0',
      ad: {
        name: 'ad',
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
