const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { CODE_HOSTS } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()

    t.context.flossbankOrg = await db.organization.create({
      name: 'flossbank',
      host: CODE_HOSTS.GitHub,
      userId: t.context.userId1,
      email: undefined,
      avatarUrl: 'https://testing-url'
    })
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

test('POST `/organization/github-auth` 200 success | create new user', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.true(!!payload.user.id)
  t.true(payload.success)

  const user = await t.context.db.user.get({ userId: payload.user.id })

  // make sure that their API key was cached in Dynamo
  const { auth } = t.context
  const apiKeyInfo = await auth.user.getApiKey({ apiKey: user.apiKey })

  t.true(apiKeyInfo.apiKey.length > 0)
})

test('POST `/organization/github-auth` 200 success | existing user', async (t) => {
  t.context.github.requestUserData.resolves({ email: 'honey@etsy.com' })
  const userBefore = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(userBefore.codeHost, undefined)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-auth',
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

test('POST `/organization/github-auth` 200 success | overlapping org', async (t) => {
  t.context.github.getUserOrgs.resolves({
    orgsData: [{ login: 'vscodium' }, { login: 'flossbank' }]
  })

  t.context.github.requestUserData.resolves({ email: 'honey@etsy.com' })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.is(!!payload.user.id, true)
  t.is(payload.success, true)
  t.deepEqual(payload.organizations, [{
    name: 'flossbank',
    host: CODE_HOSTS.GitHub,
    avatarUrl: t.context.flossbankOrg.avatarUrl,
    id: t.context.flossbankOrg.id.toString()
  }])
})

test('POST `/organization/github-auth` 400 bad request | no state', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-auth',
    payload: {
      code: 'test_code'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/organization/github-auth` 400 bad request | no code', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-auth',
    payload: {
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/organization/github-auth` 500 server error', async (t) => {
  t.context.github.requestAccessToken.rejects('error!')
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-auth',
    payload: {
      code: 'test_code',
      state: 'test_state'
    }
  })
  t.deepEqual(res.statusCode, 500)
})
