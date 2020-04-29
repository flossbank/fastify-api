const test = require('ava')
const { MAINTAINER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')
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

test('POST `/maintainer/logout` 200 success', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/logout',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=maintainer-session`
    }
  })
  t.deepEqual(res.statusCode, 200)

  // no cookie is still 200
  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/logout'
  })
  t.deepEqual(res.statusCode, 200)
})

test('POST `/maintainer/logout` 500 server error', async (t) => {
  t.context.auth.maintainer.deleteWebSession.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/logout'
  })
  t.deepEqual(res.statusCode, 500)
})
