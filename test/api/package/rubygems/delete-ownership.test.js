const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../../_helpers/_setup')
const { REGISTRIES, LANGUAGES, USER_WEB_SESSION_COOKIE } = require('../../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    const session = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session = session.sessionId

    const { id: userId2 } = await db.user.create({ email: 'bear@boo.com' })
    t.context.userId2 = userId2.toHexString()

    const { id: userId3 } = await db.user.create({ email: 'rabbit@boo.com' })
    t.context.userId3 = userId3.toHexString()
    const session3 = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.session3 = session3.sessionId

    // set up the scenario: Honey (user 1) maintains 2 ruby packages (rails, sodium, saturn),
    // and 1 javascript package (jayess); she's about to delete RubyGems ownership
    // information; she co-maintains one of her ruby packages (sodium) with Bear (user 2)
    // and Rabbit (user 3); Rabbit is an invite-maintainer on sodium, Bear is a
    // registry-maintainer. Honey and Bear co-maintain another package (saturn), and Rabbit
    // maintains a package of her own (moonbase).
    const { id: railsId } = await db.package.create({
      name: 'rails-server',
      registry: REGISTRIES.RUBYGEMS,
      language: LANGUAGES.RUBY
    })
    await db.package.update({
      packageId: railsId,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100, source: 'registry' }]
    })
    t.context.railsId = railsId.toHexString()

    const { id: sodium } = await db.package.create({
      name: 'sodium-native-rb',
      registry: REGISTRIES.RUBYGEMS,
      language: LANGUAGES.RUBY
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

    const { id: jayess } = await db.package.create({
      name: 'jayess',
      registry: REGISTRIES.NPM,
      language: LANGUAGES.JAVASCRIPT
    })
    await db.package.update({
      packageId: jayess,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 100, source: 'registry' }
      ]
    })
    t.context.jayess = jayess.toHexString()

    const { id: saturn } = await db.package.create({
      name: 'saturn',
      registry: REGISTRIES.RUBYGEMS,
      language: LANGUAGES.RUBY
    })
    await db.package.update({
      packageId: saturn,
      maintainers: [
        { userId: t.context.userId1, revenuePercent: 70, source: 'registry' },
        { userId: t.context.userId2, revenuePercent: 30, source: 'registry' }
      ]
    })
    t.context.saturn = saturn.toHexString()

    const { id: moonbase } = await db.package.create({
      name: 'moonbase',
      registry: REGISTRIES.RUBYGEMS,
      language: LANGUAGES.RUBY
    })
    await db.package.update({
      packageId: moonbase,
      maintainers: [{ userId: t.context.userId3, revenuePercent: 100, source: 'registry' }]
    })
    t.context.moonbase = moonbase.toHexString()
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

test('DELETE `/package/rubygems/ownership` 401 unauthorized | middleware', async (t) => {
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/package/rubygems/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('DELETE `/package/rubygems/ownership` 200 success', async (t) => {
  const { userId1: userId } = t.context

  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/package/rubygems/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 200)

  // the db now shows they maintain 0 ruby packages
  const rubyPackages = await t.context.db.package.getOwnedPackages({ userId, registry: REGISTRIES.RUBYGEMS, language: LANGUAGES.RUBY })
  t.is(rubyPackages.length, 0)

  // they still are marked as maintaining the javascript package
  const jsPackages = await t.context.db.package.getOwnedPackages({ userId, registry: REGISTRIES.NPM, language: LANGUAGES.JAVASCRIPT })
  t.is(jsPackages.length, 1)

  // Sodiums revenue is now split between the two remaining maintainers, without adjusted revenue percentages
  const sodium = await t.context.db.package.get({ packageId: t.context.sodium })
  t.deepEqual(sodium.maintainers, [
    { userId: t.context.userId2, revenuePercent: 60, source: 'registry' },
    { userId: t.context.userId3, revenuePercent: 10, source: 'invite' }
  ])

  // The saturn package is now only maintained by a single maintanier, whose revenue share gets auto adjusted to 100%
  const saturn = await t.context.db.package.get({ packageId: t.context.saturn })
  t.deepEqual(saturn.maintainers, [
    { userId: t.context.userId2, revenuePercent: 100, source: 'registry' }
  ])
})

test('DELETE `/package/rubygems/ownership` 200 success | remove only registry sources', async (t) => {
  const { userId3: userId } = t.context

  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/package/rubygems/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session3}`
    }
  })
  t.deepEqual(res.statusCode, 200)

  // the db now shows they maintain 1 ruby packages, the one where the source is invite
  const rubyPackages = await t.context.db.package.getOwnedPackages({ userId, registry: REGISTRIES.RUBYGEMS, language: LANGUAGES.RUBY })
  t.is(rubyPackages.length, 1)

  // the package they were co-maintaining still shows user 3 as a maintainer because they were source 'invite'
  // deleting ownership will not touch packages where the source is invite, only where source
  // is registry
  const sodium = await t.context.db.package.get({ packageId: t.context.sodium })
  t.true(sodium.maintainers.some(m => (m.userId === t.context.userId3 && m.revenuePercent === 10 && m.source === 'invite')))
})

test('DELETE `/package/rubygems/ownership` 500 server error', async (t) => {
  t.context.db.user.unlinkFromRegistry = () => { throw new Error('oh no!') }
  const res = await t.context.app.inject({
    method: 'DELETE',
    url: '/package/rubygems/ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
