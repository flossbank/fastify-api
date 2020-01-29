const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const maintainerId1 = await db.createMaintainer({
      firstName: 'Honesty',
      lastName: 'Honor',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper',
      payoutInfo: 'honey@booboo.com'
    })
    t.context.maintainerId1 = maintainerId1.toHexString()
    await db.verifyMaintainer('honey@etsy.com')

    const unverifiedMaintainerId = await db.createMaintainer({
      firstName: 'Honesty2',
      lastName: 'Honor',
      email: 'honey2@etsy.com',
      password: 'beekeeperbookkeeper',
      payoutInfo: 'honey2@booboo.com'
    })
    t.context.unverifiedMaintainerId = unverifiedMaintainerId.toHexString()
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.getUISession.resolves({
    maintainerId: t.context.maintainerId1
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('GET `/maintainer/get` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/get',
    query: { maintainerId: t.context.maintainerId1 },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/get` 401 unauthorized | wrong maintainer id', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/get',
    query: { maintainerId: 'bogus-maintainer' },
    headers: { authorization: 'invalid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/get` 400 | unverified', async (t) => {
  t.context.auth.getUISession.resolves({
    maintainerId: t.context.unverifiedMaintainerId
  })
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/get',
    query: { maintainerId: t.context.unverifiedMaintainerId },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/maintainer/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/get',
    query: { maintainerId: t.context.maintainerId1 },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    maintainer: {
      id: t.context.maintainerId1,
      firstName: 'Honesty',
      lastName: 'Honor',
      email: 'honey@etsy.com',
      payoutInfo: 'honey@booboo.com'
    }
  })
})

test('GET `/maintainer/get` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/get',
    query: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/maintainer/get` 500 server error', async (t) => {
  t.context.db.getMaintainer = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/get',
    query: { maintainerId: t.context.maintainerId1 },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
