const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {})
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

test('POST `/subscribe` success', async (t) => {
  t.context.email.sendSubscribeEmail.resolves({ success: true })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/subscribe',
    payload: {
      email: 'poopyfeet@gmail.com'
    }
  })
  const subscribers = await t.context.db.getSubscribers()
  t.true(!!subscribers.find((sub) => sub.email === 'poopyfeet@gmail.com'))
  t.deepEqual(res.statusCode, 200)
})

test('POST `/subscribe` 401 email already subscribed', async (t) => {
  t.context.db.subscribe = () => {
    const error = new Error()
    error.code = 11000 // Dupe key mongo error
    throw error
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/subscribe',
    payload: {
      email: 'poopyfeet@gmail.com'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/subscribe` 400 | no email', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/subscribe',
    payload: {
      email: ''
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/subscribe` 500 server error', async (t) => {
  t.context.db.subscribe = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/get',
    payload: {
      email: 'poopyfeet@gmail.com'
    }
  })
  t.deepEqual(res.statusCode, 500)
})
