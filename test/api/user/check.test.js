const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { INTEG_TEST_KEY } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const { apiKey } = await db.createUser({ email: 'honey@etsy.com', billingInfo: {} })
    t.context.apiKey = apiKey
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

test('POST `/user/check` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { email: 'email@asdf.com' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { apiKey: 'apiKey' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/check` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { email: 'honey@etsy.com', apiKey: t.context.apiKey }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/user/check` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { email: 'email@asdf.com', apiKey: 'apiKey' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/check` 429 unauthorized', async (t) => {
  // first req, response isn't important
  await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { email: 'email@asdf.com', apiKey: 'apiKey' }
  })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { email: 'email@asdf.com', apiKey: 'apiKey' }
  })
  t.deepEqual(res.statusCode, 429)
})

test('POST `/user/check` no throttling for integ key', async (t) => {
  await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { email: 'email@asdf.com', apiKey: INTEG_TEST_KEY }
  })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { email: 'email@asdf.com', apiKey: INTEG_TEST_KEY }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/user/check` 500 server error', async (t) => {
  t.context.db.getUserByEmail = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/check',
    payload: { email: 'email@asdf.com', apiKey: 'apiKey' }
  })
  t.deepEqual(res.statusCode, 500)
})
