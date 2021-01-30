const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const email = 'honey@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()

    const sessionWithoutUsername = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionWithoutUsername = sessionWithoutUsername.sessionId
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

test('PUT `/maintainer/update-username` 401 | unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-username',
    body: {
      username: 'hotsauce'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=bad_session`
    }
  })
  t.is(res.statusCode, 401)
})

test('PUT `/maintainer/update-username` 400 | missing username', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-username',
    body: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutUsername}`
    }
  })
  t.is(res.statusCode, 400)
})

test('PUT `/maintainer/update-username` | success', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-username',
    body: {
      username: 'hotsauce2'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutUsername}`
    }
  })
  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true
  })
  t.is(user.username, 'hotsauce2')

  // Update the username again -
  // proving that update can either update from undefined -> exists or exists -> something else
  const res2 = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-username',
    body: {
      username: 'hotsauce3'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutUsername}`
    }
  })
  const user2 = await t.context.db.user.get({ userId: t.context.userId1 })
  t.is(res2.statusCode, 200)
  t.deepEqual(JSON.parse(res2.payload), {
    success: true
  })
  t.is(user2.username, 'hotsauce3')
})

test('PUT `/maintainer/update-username` 500 error', async (t) => {
  t.context.db.user.updateUsername = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/maintainer/update-username',
    body: {
      username: 'guac'
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionWithoutUsername}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
