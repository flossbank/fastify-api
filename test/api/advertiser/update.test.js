const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')

test.before(async (t) => {
  await before(t, () => {})
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

test('POST `/advertiser/update` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const advertiserId = (await t.context.db.createAdvertiser({
    name: 'Honesty',
    email: 'honey1@etsy.com',
    password: 'beekeeperbookkeeper'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update',
    payload: {
      advertiserId,
      advertiser: { organization: 'ad org' }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/update` 200 success', async (t) => {
  const advertiserId = (await t.context.db.createAdvertiser({
    name: 'Honesty',
    email: 'honey2@etsy.com',
    password: 'beekeeperbookkeeper'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update',
    payload: {
      advertiserId,
      advertiser: { organization: 'ad org' }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.getAdvertiser(advertiserId)
  t.deepEqual(advertiser.organization, 'ad org')
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
    payload: { advertiserId: 'test-advertiser-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/update` 500 server error', async (t) => {
  t.context.db.updateAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update',
    payload: { advertiserId: 'test-advertiser-0', advertiser: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
