const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const { insertedId: userId1, apiKey } = await db.createUser({
      email: 'honey@etsy.com',
      billingInfo: {}
    })
    t.context.apiKey = apiKey
    t.context.userId1 = userId1.toHexString()
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.getUISession.resolves({
    userId: t.context.userId1
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('POST `/user/opt-out` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/opt-out',
    payload: { optOutOfAds: true },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/user/opt-out` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/opt-out',
    payload: { optOutOfAds: true },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  t.deepEqual(t.context.auth.updateUserOptOutSetting.lastCall.args, [t.context.apiKey, true])
})

test('POST `/user/opt-out` 500 server error', async (t) => {
  t.context.auth.updateUserOptOutSetting = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/opt-out',
    payload: { optOutOfAds: true },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
