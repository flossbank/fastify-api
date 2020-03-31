const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const maintainerId1 = await db.createMaintainer({
      name: 'Honesty',
      email: 'honey1@etsy.com',
      password: 'beekeeperbookkeeper'
    })
    t.context.maintainerId1 = maintainerId1.toHexString()
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

test.after.always(async (t) => {
  await after(t)
})

test('POST `/maintainer/update-payout` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update-payout',
    payload: {
      payoutInfo: 'help@quo.cc'
    },
    headers: { authorization: 'not a valid token' }
  })
  t.is(res.statusCode, 401)
})

test('POST `/maintainer/update-payout` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update-payout',
    payload: {
      payoutInfo: 'help@quo.cc'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const maintainer = await t.context.db.getMaintainer(t.context.maintainerId1)
  t.is(maintainer.payoutInfo, 'help@quo.cc')
})

test('POST `/maintainer/update-payout` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update-payout',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 400)
})

test('POST `/maintainer/update-payout` 500 server error', async (t) => {
  t.context.db.updateMaintainerPayoutInfo = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update-payout',
    payload: {
      payoutInfo: 'help@quo.cc'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.is(res.statusCode, 500)
})
