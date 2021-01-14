const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

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

test('POST `/maintainer/register` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { email: 'not-valid-email' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/maintainer/register` 409 conflict', async (t) => {
  const { db } = t.context
  await db.user.create({ email: 'honeyyy@etsy.com' })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { email: 'honeyyy@etsy.com' }
  })

  t.deepEqual(res.statusCode, 409)
  const payload = JSON.parse(res.payload)
  t.false(payload.success)
})

test('POST `/maintainer/register` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { email: 'peter@quo.cc' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.true(payload.success)
})

test('POST `/maintainer/register` 200 success | with referral code', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { email: 'peter2@quo.cc', referralCode: 'asdf' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.true(payload.success)
})

test('POST `/maintainer/register` 500 server error', async (t) => {
  t.context.auth.user.beginRegistration = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/register',
    payload: { email: 'peter@quo.cc' }
  })
  t.deepEqual(res.statusCode, 500)
})
