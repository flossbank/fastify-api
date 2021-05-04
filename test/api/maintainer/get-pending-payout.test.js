const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    // user with no payouts
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session1 = session1.sessionId

    // user with only paid payouts
    const { id: userId2 } = await db.user.create({ email: 'bear@etsy.com' })
    t.context.userId2 = userId2.toHexString()
    await db.db.collection('users').updateOne({ _id: userId2 }, {
      $set: {
        payouts: [{
          id: 'abc',
          amount: 100,
          paid: true
        }]
      }
    })
    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.session2 = session2.sessionId

    const { id: userId3 } = await db.user.create({ email: 'robin@etsy.com' })
    t.context.userId3 = userId3.toHexString()
    await db.db.collection('users').updateOne({ _id: userId3 }, {
      $set: {
        payouts: [{
          id: 'abc',
          amount: 100000
        },
        {
          id: 'abcd',
          amount: 100000,
          paid: false
        }, {
          id: 'abcd',
          amount: 100000,
          paid: true
        }]
      }
    })
    const session3 = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.session3 = session3.sessionId
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

test('GET `/maintainer/pending-payout` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/pending-payout` 200 success | maintainer with multiple payouts', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session3}`
    }
  })

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    payout: 2
  })
})

test('GET `/maintainer/pending-payout` 200 success | maintainer with no packages', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    payout: 0
  })
})

test('GET `/maintainer/pending-payout` 200 success | maintainer with only paid packages', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session2}`
    }
  })

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    payout: 0
  })
})

test('GET `/maintainer/pending-payout` 500 server error', async (t) => {
  t.context.db.maintainer.getPendingPayout = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/pending-payout',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
