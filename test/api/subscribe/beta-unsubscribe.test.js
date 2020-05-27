const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    t.context.token = await db.subscribe.betaSubscribe('poopy_feet@gmail.com')
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

test('POST `/beta/unsubscribe` success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/beta/unsubscribe',
    body: { token: t.context.token }
  })
  const subscribers = await t.context.db.subscribe.getBetaSubscribers()
  t.false(!!subscribers.find(val => val.email === 'poopy_feet@gmail.com'))
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/beta/unsubscribe` 400 | no token', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/beta/unsubscribe',
    body: { token: '' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/beta/subscribe` 500 server error', async (t) => {
  t.context.db.subscribe.betaUnsubscribe = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/beta/unsubscribe',
    body: { token: t.context.token }
  })
  t.deepEqual(res.statusCode, 500)
})
