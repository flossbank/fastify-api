const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    await db.subscribe('poopy_feet@gmail.com')
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

test('GET `/unsubscribe` success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/unsubscribe',
    query: { email: 'poopy_feet@gmail.com' }
  })
  const subscribers = await t.context.db.getSubscribers()
  t.false(!!subscribers.find(val => val.email === 'poopy_feet@gmail.com'))
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(res.body, 'Succesfully unsubscribed')
})

test('GET `/unsubscribe` 400 | no email', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/unsubscribe',
    query: { email: '' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/subscribe` 500 server error', async (t) => {
  t.context.db.unSubscribe = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/unsubscribe',
    query: { email: 'poopy_feet@gmail.com' }
  })
  t.deepEqual(res.statusCode, 500)
})
