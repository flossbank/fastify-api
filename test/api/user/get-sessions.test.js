const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()

    t.context.sessionId1 = await auth.user.createWebSession({ userId: t.context.userId1 })

    await db.db.collection('users').updateOne({
      _id: userId1
    }, {
      $push: {
        sessionActivity: {
          $each: [
            { id: 'abc' },
            { id: 'def' },
            { id: 'ghi' }
          ]
        }
      }
    })
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

test('GET `/user/get-sessions` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-sessions',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/user/get-sessions` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-sessions',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.is(payload.userSessionData.sessionCount, 3)
})

test('GET `/user/get-sessions` 500 server error', async (t) => {
  t.context.db.user.getSessions = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-sessions',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
