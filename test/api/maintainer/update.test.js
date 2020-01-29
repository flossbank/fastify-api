const test = require('ava')
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

test.after.always(async (t) => {
  await after(t)
})

test('POST `/maintainer/update` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const maintainerId = (await t.context.db.createMaintainer({
    name: 'Honesty',
    email: 'honey1@etsy.com',
    password: 'beekeeperbookkeeper'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: {
      maintainerId,
      maintainer: {
        payoutInfo: 'help@quo.cc'
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/maintainer/update` 200 success', async (t) => {
  const maintainerId = (await t.context.db.createMaintainer({
    name: 'Honesty',
    email: 'honey2@etsy.com',
    password: 'beekeeperbookkeeper'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: {
      maintainerId,
      maintainer: {
        payoutInfo: 'help@quo.cc'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const maintainer = await t.context.db.getMaintainer(maintainerId)
  t.deepEqual(maintainer.payoutInfo, 'help@quo.cc')
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
  t.context.db.updateMaintainer = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update',
    payload: {
      maintainerId: 'test-maintainer-0',
      maintainer: {
        payoutInfo: 'help@quo.cc'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
