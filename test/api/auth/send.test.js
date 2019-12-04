const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/auth/send` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/send',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/auth/send` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/send',
    payload: { email: 'peter@quo.cc' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/auth/send` 500 server error', async (t) => {
  t.context.auth.sendUserToken.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/auth/send',
    payload: { email: 'peter@quo.cc' }
  })
  t.deepEqual(res.statusCode, 500)
})
