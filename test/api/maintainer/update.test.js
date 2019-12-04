const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('POST `/maintainer/update` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: {
      maintainerId: 'test-maintainer-0',
      maintainer: {
        payoutEmail: 'help@quo.cc'
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/maintainer/update` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: {
      maintainerId: 'test-maintainer-0',
      maintainer: {
        payoutEmail: 'help@quo.cc'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/maintainer/update` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: { maintainerId: 'test-maintainer-0', maintainer: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/maintainer/update` 500 server error', async (t) => {
  t.context.db.updateMaintainer.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: {
      maintainerId: 'test-maintainer-0',
      maintainer: {
        payoutEmail: 'help@quo.cc'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
