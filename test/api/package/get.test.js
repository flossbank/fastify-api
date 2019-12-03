const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('GET `/package/get` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    query: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/package/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    query: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: await t.context.db.getOwnedPackages()
  })
})

test('GET `/package/get` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    query: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/package/get` 500 server error', async (t) => {
  t.context.db.getOwnedPackages.throws()
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get',
    query: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
