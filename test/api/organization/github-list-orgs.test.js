const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { ORG_ROLES, CODE_HOSTS, USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    await db.user.attachAccessToken({ userId: t.context.userId1, host: CODE_HOSTS.GitHub, accessToken: 'accessToken' })
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session1 = session1.sessionId

    const { id: userId2 } = await db.user.create({ email: 'flower@etsy.com' })
    t.context.userId2 = userId2.toHexString()

    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.session2 = session2.sessionId
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

test('POST `/organization/github-list-orgs` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-list-orgs',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  const org = await t.context.db.organization.getByNameAndHost({ name: 'flossbank', host: CODE_HOSTS.GitHub })
  t.deepEqual(user.organizations, [{
    organizationId: org.id.toString(),
    role: ORG_ROLES.WRITE
  }])

  t.deepEqual(payload.organizations, [{
    name: 'flossbank',
    host: 'GitHub',
    id: org.id.toString()
  }])
  t.is(payload.success, true)
})

test('POST `/organization/github-list-orgs` 200 success | multiple orgs', async (t) => {
  t.context.github.getUserOrgs.resolves({
    orgsData: [{ login: 'vscodium' }, { login: 'yttrium', url: 'other_stuff' }]
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-list-orgs',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  const org1 = await t.context.db.organization.getByNameAndHost({ name: 'vscodium', host: CODE_HOSTS.GitHub })
  const org2 = await t.context.db.organization.getByNameAndHost({ name: 'yttrium', host: CODE_HOSTS.GitHub })
  t.truthy(user.organizations.find((rel) => rel.organizationId === org1.id.toString()))
  t.truthy(user.organizations.find((rel) => rel.organizationId === org2.id.toString()))

  t.deepEqual(payload.organizations, [
    { name: 'vscodium', host: 'GitHub', id: org1.id.toString() },
    { name: 'yttrium', host: 'GitHub', id: org2.id.toString() }
  ])
  t.is(payload.success, true)
})

test('POST `/organization/github-list-orgs` 401', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-list-orgs',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=bad_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/organization/github-list-orgs` 500 server error', async (t) => {
  t.context.github.getUserOrgs.rejects('error!')
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-list-orgs',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
