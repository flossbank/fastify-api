const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    await db.createUser({ email: 'honey@etsy.com' })
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

test('POST `/user/login` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/login',
    body: { email: 'honey@etsy.com' }
  })

  t.true(t.context.auth.sendMagicLink.calledOnce)

  const payload = JSON.parse(res.payload)
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(payload, { success: true, code: 'code' })
})

test('POST `/user/login` 404 not found', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/login',
    body: { email: 'agave@etsy.com' }
  })

  t.true(t.context.auth.sendMagicLink.notCalled)

  const payload = JSON.parse(res.payload)
  t.deepEqual(res.statusCode, 404)
  t.deepEqual(payload, { success: false })
})

test('POST `/user/login` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/login',
    body: {}
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/login` 500 server error', async (t) => {
  t.context.auth.sendMagicLink = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/login',
    body: { email: 'honey@etsy.com' }
  })
  t.deepEqual(res.statusCode, 500)
})