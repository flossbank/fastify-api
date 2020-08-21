const test = require('ava')
const { ORG_ROLES, USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()

    const session = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session = session.sessionId

    const { id: userId2 } = await db.user.create({ email: 'flower@etsy.com' })
    t.context.userId2 = userId2.toHexString()

    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.session2 = session2.sessionId

    // create org
    await db.organization.create({ name: 'vscodium', host: 'GitHub', userId: t.context.userId2 })
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

test('POST `/organization/choose` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/choose',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/choose',
    payload: { name: 'pkg name' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/choose',
    payload: { host: 'hoooost' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/organization/choose` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/choose',
    payload: { name: 'flossbank', host: 'GitHub' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/organization/choose` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/choose',
    payload: { name: 'flossbank', host: 'GitHub' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.true(payload.success)
  t.true(payload.created)
  t.deepEqual(payload.organization, {
    id: payload.organization.id,
    name: 'flossbank',
    donationAmount: 0,
    billingInfo: {},
    globalDonation: false,
    host: 'GitHub',
    email: '',
    users: [{
      userId: t.context.userId1,
      role: ORG_ROLES.ADMIN
    }]
  })

  const user = await t.context.db.user.get({ userId: t.context.userId1 })
  t.deepEqual(user.organizations, [{
    organizationId: payload.organization.id,
    role: ORG_ROLES.ADMIN
  }])
})

test('POST `/organization/choose` 200 success | existing org', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/choose',
    payload: { name: 'vscodium', host: 'GitHub' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session2}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.true(payload.success)
  t.deepEqual(payload.organization, {
    id: payload.organization.id,
    name: 'vscodium',
    host: 'GitHub',
    email: '',
    donationAmount: 0,
    billingInfo: {},
    globalDonation: false,
    users: [{
      userId: t.context.userId2,
      role: ORG_ROLES.ADMIN
    }]
  })
})

test('POST `/organization/choose` 500 server error', async (t) => {
  t.context.db.organization.getByNameAndHost = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/organization/choose',
    payload: { name: 'flossbank', host: 'GitHub' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
