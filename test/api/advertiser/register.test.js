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

test('POST `/advertiser/register` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/register',
    payload: {
      advertiser: {
        firstName: 'advertiser',
        lastName: 'captain',
        email: 'ADVERTISER@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  // email has been lowercased in db
  const advertiser = await t.context.db.getAdvertiserByEmail('advertiser@ads.com')
  t.is(advertiser.firstName, 'advertiser')
  t.is(advertiser.lastName, 'captain')
})

test('POST `/advertiser/register` 409 duplicate email', async (t) => {
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

  t.deepEqual(res.statusCode, 409)
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

test('POST `/advertiser/register` 500 server error', async (t) => {
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
