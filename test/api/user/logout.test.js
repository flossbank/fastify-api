const test = require('ava')
const { USER_SESSION_KEY } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, () => {})
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

test('POST `/user/logout` 200 success', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/user/logout',
    headers: {
      cookie: `${USER_SESSION_KEY}=user-session`
    }
  })
  t.deepEqual(res.statusCode, 200)

  // no cookie is still 200
  res = await t.context.app.inject({
    method: 'POST',
    url: '/user/logout'
  })
  t.deepEqual(res.statusCode, 200)
})

test('POST `/user/logout` 500 server error', async (t) => {
  t.context.auth.deleteUserSession.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/logout'
  })
  t.deepEqual(res.statusCode, 500)
})
