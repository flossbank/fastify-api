const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId = userId.toHexString()

    const user = await db.user.get({ userId })
    const token = await auth.user.setInstallApiKey({ apiKey: user.apiKey })
    t.context.apiKey = user.apiKey
    t.context.token = token
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('POST `/user/complete-install` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-install',
    payload: { token: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/complete-install` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-install',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/complete-install` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-install',
    payload: { token: t.context.token }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.is(payload.success, true)
  t.is(payload.apiKey, t.context.apiKey)
})

test('POST `/user/complete-install` 500 server error', async (t) => {
  t.context.auth.user.getInstallApiKey = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/complete-install',
    payload: { token: 'inconsequential' }
  })
  t.deepEqual(res.statusCode, 500)
})
