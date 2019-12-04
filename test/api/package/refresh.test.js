const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('POST `/package/refresh` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: 'test-maintainer-0',
      packageRegistry: 'npm'
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/package/refresh` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: 'test-maintainer-0',
      packageRegistry: 'npm'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/package/refresh` 400 bad request | not a maintainer', async (t) => {
  t.context.db.getMaintainer.resolves({})
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: 'test-maintainer-0',
      packageRegistry: 'npm'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 400 bad request | no tokens', async (t) => {
  t.context.db.getMaintainer.resolves({ id: 'test-maintainer-0' })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: 'test-maintainer-0',
      packageRegistry: 'npm'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: 'test-maintainer-0',
      packageRegistry: 'github.com'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 500 server error', async (t) => {
  t.context.db.refreshPackageOwnership.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: 'test-maintainer-0',
      packageRegistry: 'npm'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
