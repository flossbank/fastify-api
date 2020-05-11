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

test('POST `/beta/subscribe` success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/beta/subscribe',
    payload: {
      email: 'POOPyfeet@gmail.com'
    }
  })
  const subscribers = await t.context.db.subscribe.getBetaSubscribers()
  t.true(!!subscribers.find((sub) => sub.email === 'poopyfeet@gmail.com'))
  t.deepEqual(res.statusCode, 200)
})

test('POST `/beta/subscribe` 409 email already subscribed', async (t) => {
  t.context.db.subscribe.betaSubscribe = () => {
    const error = new Error()
    error.code = 11000 // Dupe key mongo error
    throw error
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/beta/subscribe',
    payload: {
      email: 'poopyfeet@gmail.com'
    }
  })
  t.deepEqual(res.statusCode, 409)
})

test('POST `/beta/subscribe` 400 | no email', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/beta/subscribe',
    payload: {
      email: ''
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/beta/subscribe` 500 server error', async (t) => {
  t.context.db.subscribe.betaSubscribe = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/beta/subscribe',
    payload: {
      email: 'poopyfeet@gmail.com'
    }
  })
  t.deepEqual(res.statusCode, 500)
})
