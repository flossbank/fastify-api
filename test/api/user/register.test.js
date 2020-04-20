const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

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

test('POST `/user/register` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/register',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/register',
    payload: { email: 'not-valid-email' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/register` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/register',
    payload: { email: 'peter@quo.cc' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/user/register` 500 server error', async (t) => {
  t.context.auth.generateToken.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/register',
    payload: { email: 'peter@quo.cc' }
  })
  t.deepEqual(res.statusCode, 500)
})
