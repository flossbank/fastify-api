const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')
const { AD_NOT_CLEAN_MSG } = require('../../../helpers/constants')

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
  t.context.auth.getUISession.resolves({
    advertiserId: t.context.advertiserId1
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('POST `/ad/create` 401 unauthorized | no session', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      name: 'add 1',
      title: 'halp',
      body: 'dov with',
      url: 'the puzzle'
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad/create` 200 success', async (t) => {
  const adToCreate = {
    name: 'add 1',
    title: 'halp',
    body: 'dov with',
    url: 'the puzzle'
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: adToCreate,
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload
  const createdAd = Object.assign({}, adToCreate, { id })
  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId1)
  t.deepEqual(advertiser.adDrafts.length, 1)
  t.deepEqual(advertiser.adDrafts[0], createdAd)
})

test('POST `/ad/create` 400 bad request | trash ads', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      name: 'hello',
      body: 'a\n\nbc',
      title: 'ABC',
      url: 'https://abc.com'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: AD_NOT_CLEAN_MSG })
})

test('POST `/ad/create` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      name: 'camp ad'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      name: 'ad poop',
      title: 'poop'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      name: 'ad dump',
      title: 'shoes',
      body: 'argh'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      name: 'ad dump',
      title: 'shoes',
      url: 'argh url'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad/create` 500 server error', async (t) => {
  t.context.db.createAdDraft = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      name: 'ad dump',
      title: 'shoes',
      body: 'valid',
      url: 'argh url'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
