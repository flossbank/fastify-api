const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    await db.user.create({ email: 'honey@etsy.com' })
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

test('POST `/user/request-login` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/request-login',
    body: { email: 'honey@etsy.com' }
  })

  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  const emailArgs = t.context.email.sendUserMagicLinkEmail.lastCall.args[1]
  t.is(payload.success, true)
  t.is(payload.code, emailArgs.code)
})

test('POST `/user/request-login` 404 not found', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/request-login',
    body: { email: 'agave@etsy.com' }
  })

  t.deepEqual(res.statusCode, 404)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload, { success: false })
})

test('POST `/user/request-login` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/request-login',
    body: {}
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/request-login` 500 server error', async (t) => {
  t.context.auth.user.beginAuthentication = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/request-login',
    body: { email: 'honey@etsy.com' }
  })
  t.deepEqual(res.statusCode, 500)
})
