const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')
const { maintainerSessionKey } = require('../../../helpers/constants')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/maintainer/logout` 200 success', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/logout',
    headers: {
      cookie: `${maintainerSessionKey}=maintainer-session`
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
  t.context.auth.deleteMaintainerSession.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/logout'
  })
  t.deepEqual(res.statusCode, 500)
})
