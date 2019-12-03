const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('POST `/package/update` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: [
          { maintainerId: 'test-maintainer-0', revenuePercent: 100 }
        ],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/package/update` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: [
          { maintainerId: 'test-maintainer-0', revenuePercent: 100 }
        ],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/package/update` 400 bad request | not a pkg', async (t) => {
  t.context.db.getPackage.resolves({})
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: [
          { maintainerId: 'test-maintainer-0', revenuePercent: 100 }
        ],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/update` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: { packageId: 'test-package-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: []
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: [{}],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/update` 500 server error', async (t) => {
  t.context.db.updatePackage.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/update',
    payload: {
      packageId: 'test-package-0',
      package: {
        maintainers: [
          { maintainerId: 'test-maintainer-0', revenuePercent: 100 }
        ],
        owner: 'test-maintainer-0'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
