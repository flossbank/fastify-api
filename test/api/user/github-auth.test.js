const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com', githubId: 'id-1' })
    t.context.userId1 = userId1.toHexString()

    const { id: userId2 } = await db.user.create({ email: 'mouse@etsy.com', githubId: 'id-2' })
    t.context.userId2 = userId2.toHexString()
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('POST `/user/github-auth` 200 success | create new user', async (t) => {
  t.context.github.requestUserData.resolves({ email: null, githubId: 'id-5555', login: 'telescope' })
  t.context.github.requestUserEmail.resolves('logitech@etsy.com')

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.is(!!payload.user.id, true)
  t.is(payload.success, true)
  t.is(payload.created, true)

  const user = await t.context.db.user.get({ userId: payload.user.id })
  // Ensure github id was attached
  t.is(user.githubId, 'id-5555')

  // ensure that their email is correct (from GH)
  t.is(user.email, 'logitech@etsy.com')
  t.is(user.username, 'telescope')

  // make sure that their API key was cached in Dynamo
  const { auth } = t.context
  const apiKeyInfo = await auth.user.getApiKey({ apiKey: user.apiKey })

  t.true(apiKeyInfo.apiKey.length > 0)
})

// TODO should we really change the stored GitHub ID ?
test('POST `/user/github-auth` 200 success | existing user | diff github Id', async (t) => {
  t.context.github.requestUserData.resolves({ email: 'mouse@etsy.com', githubId: 'id-3', login: 'blah' })
  t.context.github.requestUserEmail.resolves('mouse@etsy.com')

  const userBefore = await t.context.db.user.get({ userId: t.context.userId2 })
  t.is(userBefore.codeHost, undefined)
  t.is(userBefore.githubId, 'id-2')

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.is(!!payload.user.id, true)
  t.is(payload.success, true)
  t.is(payload.created, false)

  const userAfter = await t.context.db.user.get({ userId: payload.user.id })
  t.is(userAfter.githubId, 'id-3')
})

test('POST `/user/github-auth` 200 success | existing user', async (t) => {
  t.context.github.requestUserData.resolves({ email: 'honey@etsy.com', githubId: 'id-1', login: 'blah' })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.is(!!payload.user.id, true)
  t.is(payload.success, true)
})

test('POST `/user/github-auth` 400 bad request | no state', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/github-auth` 400 bad request | no code', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/github-auth` 400 bad request | no email from github', async (t) => {
  t.context.github.requestUserEmail.resolves(undefined)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      state: 'test_state',
      code: 'test_code'
    }
  })

  t.deepEqual(res.statusCode, 400)
})

test('POST `/user/github-auth` 500 server error', async (t) => {
  t.context.github.requestAccessToken.rejects('error!')
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/user/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 500)
})
