const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { alreadyExistsMessage } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, () => {})
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

test('POST `/advertiser/create` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: {
      advertiser: {
        firstName: 'advertiser',
        lastName: 'captain',
        email: 'advertiser@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const ad = await t.context.db.getAdvertiser(id)
  t.deepEqual(ad.firstName, 'advertiser')
  t.deepEqual(ad.lastName, 'captain')
})

test('POST `/advertiser/create` 400 duplicate email', async (t) => {
  t.context.db.createAdvertiser = () => {
    const error = new Error()
    error.code = 11000 // Dupe key mongo error
    throw error
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: {
      advertiser: {
        firstName: 'advertiser',
        lastName: 'captain',
        email: 'advertiser@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })

  t.deepEqual(res.statusCode, 400)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, false)
  const { message } = payload
  t.deepEqual(message, alreadyExistsMessage)
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
    payload: { advertiser: { name: 'name', email: 'email@email.com' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: { advertiser: { email: 'email@email.com', password: 'Paps%df3$sd' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: { advertiser: { name: 'joel', email: 'email@email.com', password: 'insecurepassword' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: { advertiser: { name: 'joel', email: 'not-valid-email', password: 'insecurepassword' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/create` 500 server error', async (t) => {
  t.context.db.createAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: {
      advertiser: {
        firstName: 'advertiser',
        lastName: 'captain',
        email: 'advertiser@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
