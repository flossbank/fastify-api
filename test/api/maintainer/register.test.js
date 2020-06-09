const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { MSGS: { ALREADY_EXISTS } } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t)
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

test('POST `/maintainer/register` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: {
      maintainer: {
        firstName: 'maintainer',
        lastName: 'captain',
        email: 'MAINTAINER@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  // email has been lowercased in db
  const maintainer = await t.context.db.maintainer.getByEmail({
    email: 'maintainer@ads.com'
  })
  t.is(maintainer.firstName, 'maintainer')
  t.is(maintainer.lastName, 'captain')
})

test('POST `/maintainer/register` 409 duplicate email', async (t) => {
  t.context.db.maintainer.create = () => {
    const error = new Error()
    error.code = 11000 // Dupe key mongo error
    throw error
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: {
      maintainer: {
        firstName: 'maintainer',
        lastName: 'captain',
        email: 'maintainer@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 409)
  const payload = JSON.parse(res.payload)

  t.is(payload.success, false)
  const { message } = payload
  t.is(message, ALREADY_EXISTS)
})

test('POST `/maintainer/register` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { name: 'name' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { name: 'name', email: 'email@email.com' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { email: 'email@email.com', password: 'Paps%df3$sd' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { name: 'joel', email: 'invalid-email', password: 'Paps%df3$sd' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { name: 'joel', email: 'email@email.com', password: 'insecure-password' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 400)
})

test('POST `/maintainer/register` 500 server error', async (t) => {
  t.context.db.maintainer.create = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: {
      maintainer: {
        firstName: 'maintainer',
        lastName: 'captain',
        email: 'maintainer@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 500)
})
