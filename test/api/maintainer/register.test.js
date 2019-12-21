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

test.after(async (t) => {
  await after(t)
})

test('POST `/maintainer/register` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: {
      maintainer: {
        name: 'maintainer',
        email: 'maintainer@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const maintainer = await t.context.db.getMaintainer(id)
  t.deepEqual(maintainer.verified, false)
  t.deepEqual(maintainer.name, 'maintainer')
})

test('POST `/maintainer/register` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { name: 'name' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { name: 'name', email: 'email@email.com' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { email: 'email@email.com', password: 'Paps%df3$sd' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { name: 'joel', email: 'invalid-email', password: 'Paps%df3$sd' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { maintainer: { name: 'joel', email: 'email@email.com', password: 'insecure-password' } },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/maintainer/register` 500 server error', async (t) => {
  t.context.db.createMaintainer = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: {
      maintainer: {
        name: 'maintainer',
        email: 'maintainer@ads.com',
        password: 'Paps%df3$sd'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
