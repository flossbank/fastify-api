const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.user.attachAccessToken({ userId: t.context.userId1, accessToken: 'accessToken' })
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session1 = session1.sessionId
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

test('GET `/organization/github-list-orgs` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/github-list-orgs',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.organizations, [{ name: 'flossbank', host: 'GitHub' }])
  t.is(payload.success, true)
})

test('GET `/organization/github-list-orgs` 200 success | multiple orgs', async (t) => {
  t.context.github.getUserOrgs.resolves({
    orgsData: [{ login: 'flossbank' }, { login: 'yttrium', url: 'other_stuff' }]
  })

  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/github-list-orgs',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.organizations, [
    { name: 'flossbank', host: 'GitHub' },
    { name: 'yttrium', host: 'GitHub' }
  ])
  t.is(payload.success, true)
})

test('GET `/organization/github-list-orgs` 401', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/github-list-orgs',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=bad_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/organization/github-list-orgs` 500 server error', async (t) => {
  t.context.github.getUserOrgs.rejects('error!')
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/github-list-orgs',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
