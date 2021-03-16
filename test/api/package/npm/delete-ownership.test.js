const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../../_helpers/_setup')
const { REGISTRIES, LANGUAGES, USER_WEB_SESSION_COOKIE } = require('../../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const email = 'honey@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()
    const session = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session = session.sessionId

    const { id: userId2 } = await db.user.create({ email: 'bear@boo.com' })
    t.context.userId2 = userId2.toHexString()

    const { id: userId3 } = await db.user.create({ email: 'rabbit@boo.com' })
    t.context.userId3 = userId3.toHexString()
    const session3 = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.session3 = session3.sessionId

    // set up the scenario: Honey (user 1) maintains 2 javascript packages, and 1 ruby package
    // and is about to delete NPM ownership information; she co-maintains one of her
    // JS packages with Bear (user 2)
    const { id: yttriumId } = await db.package.create({
      name: 'yttrium-server',
      registry: REGISTRIES.NPM,
      language: LANGUAGES.JAVASCRIPT
    })
    await db.package.update({
      packageId: yttriumId,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100, source: 'registry' }]
    })
    t.context.yttriumId = yttriumId.toHexString()

    const { id: sodium } = await db.package.create({
      name: 'sodium-native',
      registry: REGISTRIES.NPM,
      language: LANGUAGES.JAVASCRIPT
    })
    await db.package.update({
      packageId: sodium,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 30, source: 'registry' },
        { userId: t.context.userId2, revenuePercent: 60, source: 'registry' },
        { userId: t.context.userId3, revenuePercent: 10, source: 'invite' }
      ]
    })
    t.context.sodium = sodium.toHexString()

    const { id: roobs } = await db.package.create({
      name: 'roobs',
      registry: REGISTRIES.RUBYGEMS,
      language: LANGUAGES.RUBY
    })
    await db.package.update({
      packageId: roobs,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100, source: 'registry' }]
    })
    t.context.roobs = roobs.toHexString()

    const { id: moonbase } = await db.package.create({
      name: 'moonbase',
      registry: REGISTRIES.RUBYGEMS,
      language: LANGUAGES.RUBY
    })
    await db.package.update({
      packageId: moonbase,
      maintainers: [{ userId: t.context.userId3, revenuePercent: 100, source: 'registry' }]
    })
    t.context.moonbase = roobs.toHexString()
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

test('DELETE `/package/npm/ownership` 401 unauthorized | middleware', async (t) => {
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/package/npm/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('DELETE `/package/npm/ownership` 200 success', async (t) => {
  const { userId1: userId } = t.context

  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/package/npm/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)

  // the db now shows they maintain 0 javascript packages
  const jsPackages = await t.context.db.package.getOwnedPackages({ userId, registry: REGISTRIES.NPM, language: LANGUAGES.JAVASCRIPT })
  t.is(jsPackages.length, 0)

  // they still are marked as maintaining the ruby package
  const rubyPackages = await t.context.db.package.getOwnedPackages({ userId, registry: REGISTRIES.RUBYGEMS, language: LANGUAGES.RUBY })
  t.is(rubyPackages.length, 1)

  // the package they were co-maintaining is now fully the other person's
  const sodium = await t.context.db.package.get({ packageId: t.context.sodium })
  t.deepEqual(sodium.maintainers, [
    { userId: t.context.userId2, revenuePercent: 60, source: 'registry' },
    { userId: t.context.userId3, revenuePercent: 10, source: 'invite' }
  ])
})

test('DELETE `/package/npm/ownership` 200 success | remove only registry sources', async (t) => {
  const { userId3: userId } = t.context

  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/package/npm/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session3}`
    }
  })
  t.deepEqual(res.statusCode, 200)

  // the db now shows they maintain 1 javascript packages, the one where the source is invite
  const jsPackages = await t.context.db.package.getOwnedPackages({ userId, registry: REGISTRIES.NPM, language: LANGUAGES.JAVASCRIPT })
  t.is(jsPackages.length, 1)

  // the package they were co-maintaining still shows user 3 as a maintainer because they were source 'invite'
  // deleting ownership will not touch packages where the source is invite, only where source
  // is registry
  const sodium = await t.context.db.package.get({ packageId: t.context.sodium })
  t.true(!!sodium.maintainers.find(m => (m.userId === t.context.userId3 && m.revenuePercent === 10 && m.source === 'invite')))
})

test('DELETE `/package/npm/ownership` 500 server error', async (t) => {
  t.context.db.user.unlinkFromRegistry = () => { throw new Error('oh no!') }
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/package/npm/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
