const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.user.updateGithubId({ userId: t.context.userId1, githubId: 'test-github-id' })
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session1 = session1.sessionId

    // user with no github id
    const { id: userId2 } = await db.user.create({ email: 'bear@etsy.com' })
    t.context.userId2 = userId2.toHexString()
    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.session2 = session2.sessionId

    const { id: orgId1 } = await db.organization.create({
      name: 'flossbank',
      host: 'GitHub',
      email: 'picadillo@pringles.com'
    })
    t.context.orgId1 = orgId1.toString()
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

test('GET `/user/is-github-organization-admin` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/is-github-organization-admin',
    query: { orgId: `${t.context.orgId1}` },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/user/is-github-organization-admin` 404', async (t) => {
  t.context.db.organization.get = () => undefined
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/is-github-organization-admin',
    query: { orgId: `${t.context.orgId1}` },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('GET `/user/is-github-organization-admin` 401 unauthorized | no github id', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/is-github-organization-admin',
    query: { orgId: `${t.context.orgId1}` },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session2}`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/user/is-github-organization-admin` 401 unauthorized | not github admin', async (t) => {
  t.context.github.isUserAnOrgAdmin.resolves(false)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/is-github-organization-admin',
    query: { orgId: `${t.context.orgId1}` },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/user/is-github-organization-admin` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/is-github-organization-admin',
    query: { orgId: `${t.context.orgId1}` },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
})

test('GET `/user/is-github-organization-admin` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/is-github-organization-admin',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/user/is-github-organization-admin` 500 server error', async (t) => {
  t.context.db.organization.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/is-github-organization-admin',
    query: { orgId: `${t.context.orgId1}` },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
