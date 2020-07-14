const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { MAINTAINER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const maintainerId1 = await db.maintainer.create({
      maintainer: {
        name: 'Honesty',
        email: 'honey1@etsy.com',
        password: 'beekeeperbookkeeper'
      }
    })
    t.context.maintainerId1 = maintainerId1.toHexString()
    const session1 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId1 })
    t.context.sessionId1 = session1.sessionId
  })
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

test('POST `/maintainer/update-payout` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update-payout',
    payload: {
      payoutInfo: 'help@quo.cc'
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
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
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const maintainer = await t.context.db.maintainer.get({
    maintainerId: t.context.maintainerId1
  })
  t.is(maintainer.payoutInfo, 'help@quo.cc')
})

test('POST `/maintainer/update-payout` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update-payout',
    payload: {},
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.is(res.statusCode, 400)
})

test('POST `/maintainer/update-payout` 500 server error', async (t) => {
  t.context.db.maintainer.updatePayoutInfo = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/update-payout',
    payload: {
      payoutInfo: 'help@quo.cc'
    },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.is(res.statusCode, 500)
})
