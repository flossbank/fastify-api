const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('GET `/maintainer/revenue` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/revenue` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    revenue: await t.context.db.getRevenue()
  })
})

test('GET `/maintainer/revenue` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/maintainer/revenue` 500 server error', async (t) => {
  t.context.db.getRevenue.throws()
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/revenue',
    query: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
