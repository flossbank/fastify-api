const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE, CODE_HOSTS } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const email = 'honey@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()

    const session = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session = session.sessionId

    // existing org
    t.context.existingOrgInstallationId = '12345'
    await db.organization.create({
      name: 'Existing Org',
      host: CODE_HOSTS.GitHub,
      installationId: t.context.existingOrgInstallationId
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

test('POST `/organization/github-create` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: 'abc' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/organization/github-create` 200 success', async (t) => {
  const { github } = t.context
  github.getInstallationDetails.resolves({ account: { login: 'New Org' } })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: '42069' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.body)

  t.is(payload.organization.name, 'New Org')
  t.true(t.context.sqs.sendDistributeOrgDonationMessage.calledOnce)
})

test('POST `/organization/github-create` 200 success | even if distribution call fails', async (t) => {
  t.context.sqs.sendDistributeOrgDonationMessage.throws('error')

  const { github } = t.context
  github.getInstallationDetails.resolves({ account: { login: 'New Org' } })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: '42069' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.body)

  t.is(payload.organization.name, 'New Org')
})

test('POST `/organization/github-create` 200 success | existing org', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: t.context.existingOrgInstallationId },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.body)

  t.is(payload.organization.name, 'Existing Org')
  t.true(t.context.github.getInstallationDetails.notCalled)
})

test('POST `/organization/github-create` 400 error | installation id not provided', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/organization/github-create` 404 error | installation id is bad', async (t) => {
  const notFound = new Error()
  notFound.response = { statusCode: 404 }
  const { github } = t.context
  github.getInstallationDetails.rejects(notFound)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: 'abc' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('POST `/organization/github-create` 500 server error', async (t) => {
  t.context.github.getInstallationDetails = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/github-create',
    body: { installationId: 'abc' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
