const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../../_helpers/_setup')
const { REGISTRIES: { RUBYGEMS }, USER_WEB_SESSION_COOKIE } = require('../../../../helpers/constants')

// tests for the package refresh logic are more comprehensively done in npm/refresh-ownership
// this route calls the same DB method but with different args, so just confirming that the args are good
// and that the call happens
test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'pete@flossbank.com' })
    t.context.userId1 = userId1.toHexString()
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionId1 = session1.sessionId
    await db.user.linkToRegistry({ userId: userId1, registry: [RUBYGEMS], data: { username: 'twoseventythree' } })

    const { id: userId2 } = await db.user.create({ email: 'not_a_ruby_dev@flossbank.com' })
    t.context.userId2 = userId2.toHexString()
    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.sessionId2 = session2.sessionId
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

test('PUT `/package/rubygems/refresh-ownership` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/rubygems/refresh-ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('PUT `/package/rubygems/refresh-ownership` 200 success', async (t) => {
  t.context.registry.rubygems.getOwnedPackages.resolves(['caesar'])
  sinon.spy(t.context.db.package, 'refreshOwnership')

  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/rubygems/refresh-ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const caesar = await t.context.db.package.getByNameAndRegistry({
    name: 'caesar',
    registry: RUBYGEMS
  })

  // maintainers
  t.deepEqual(caesar.maintainers, [
    { userId: t.context.userId1, revenuePercent: 100, source: 'registry' }
  ])

  t.true(t.context.db.package.refreshOwnership.calledOnce)
})

test('PUT `/package/rubygems/refresh-ownership` 400 bad request | no rubygems info', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/rubygems/refresh-ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('PUT `/package/rubygems/refresh-ownership` 500 server error', async (t) => {
  t.context.db.user.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/rubygems/refresh-ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
