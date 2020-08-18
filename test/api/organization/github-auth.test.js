const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
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

  t.deepEqual(payload.organizations, [{ name: 'flossbank', host: 'GitHub' }])
  t.is(payload.success, true)
  t.is(payload.created, true)
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

  t.deepEqual(payload.organizations, [{ name: 'flossbank', host: 'GitHub' }])
  t.is(payload.success, true)
  t.is(payload.created, false)

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(user.codeHost.accessToken, 'test_access_token')
})

test('POST `/organization/github-auth` 200 success | multiple orgs', async (t) => {
  t.context.github.requestUserData.resolves({ email: 'honey@etsy.com' })
  t.context.github.getUserOrgs.resolves({
    orgsData: [{ login: 'flossbank' }, { login: 'yttrium', url: 'other_stuff' }]
  })
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

  t.deepEqual(payload.organizations, [
    { name: 'flossbank', host: 'GitHub' },
    { name: 'yttrium', host: 'GitHub' }
  ])
  t.is(payload.success, true)
  t.is(payload.created, false)

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(user.codeHost.accessToken, 'test_access_token')
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
  t.context.github.getUserOrgs.rejects('error!')
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
