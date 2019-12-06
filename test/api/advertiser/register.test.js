const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/advertiser/register` 200 success', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: {
      advertiser: {
        name: 'advertiser',
        email: 'advertiser@ads.com',
        password: 'papi',
        organization: 'fb'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    id: await t.context.db.createAdvertiser()
  })

  // Without organization
  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: {
      advertiser: {
        name: 'advertiser',
        email: 'advertiser@ads.com',
        password: 'papi'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    id: await t.context.db.createAdvertiser()
  })
})

test('POST `/advertiser/register` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: { advertiser: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: { advertiser: { name: 'name' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: { advertiser: { name: 'name', email: 'email' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: { advertiser: { email: 'email', password: 'pwd' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/register` 500 server error', async (t) => {
  t.context.db.createAdvertiser.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: {
      advertiser: {
        name: 'advertiser',
        email: 'advertiser@ads.com',
        password: 'papi'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
