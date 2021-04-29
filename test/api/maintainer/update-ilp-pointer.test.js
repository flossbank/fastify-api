const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const email = 'facemask@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()

    const sessionWithoutPointer = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionWithoutPointer = sessionWithoutPointer.sessionId
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

test('PUT `/maintainer/update-ilp-pointer` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-ilp-pointer',
    payload: {
      ilpPointer: '$moneyd.local.pete'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.is(res.statusCode, 401)
})

test('PUT `/maintainer/update-ilp-pointer` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-ilp-pointer',
    payload: {
      ilpPointer: '$moneyd.local.pete'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutPointer}`
    }
  })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const maintainer = await t.context.db.user.get({
    userId: t.context.userId1
  })
  t.is(maintainer.payoutInfo.ilpPointer, '$moneyd.local.pete')

  // Can update existing pointer
  const res2 = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-ilp-pointer',
    payload: {
      ilpPointer: '$moneyd.local.joel'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutPointer}`
    }
  })
  t.is(res2.statusCode, 200)
  t.deepEqual(JSON.parse(res2.payload), { success: true })

  const maintainer2 = await t.context.db.user.get({
    userId: t.context.userId1
  })
  t.is(maintainer2.payoutInfo.ilpPointer, '$moneyd.local.joel')
})

test('PUT `/maintainer/update-ilp-pointer` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-ilp-pointer',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutPointer}`
    }
  })
  t.is(res.statusCode, 400)
})

test('PUT `/maintainer/update-ilp-pointer` 500 server error', async (t) => {
  t.context.db.maintainer.updateIlpPointer = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-ilp-pointer',
    payload: {
      ilpPointer: '$moneyd.local.pete'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutPointer}`
    }
  })
  t.is(res.statusCode, 500)
})
