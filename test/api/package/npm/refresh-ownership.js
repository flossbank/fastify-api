const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../../_helpers/_setup')
const { REGISTRIES: { NPM }, LANGUAGES: { JAVASCRIPT }, USER_WEB_SESSION_COOKIE } = require('../../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'pete@flossbank.com' })
    t.context.userId1 = userId1.toHexString()
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionId1 = session1.sessionId
    await db.user.linkToRegistry({ userId: userId1, registry: [NPM], data: { username: 'twoseventythree' } })

    const { id: userId2 } = await db.user.create({ email: 'goelle@flossbank.com' })
    t.context.userId2 = userId2.toHexString()
    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.sessionId2 = session2.sessionId

    const { id: userId3 } = await db.user.create({ email: 'kmoorlando7@gmail.com' })
    t.context.userId3 = userId3.toHexString()
    const session3 = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.sessionId3 = session3.sessionId

    const { id: userId4 } = await db.user.create({ email: 'dodgeball@hotmail.com' })
    t.context.userId4 = userId4.toHexString()
    const session4 = await auth.user.createWebSession({ userId: t.context.userId4 })
    t.context.sessionId4 = session4.sessionId

    const { id: userId5 } = await db.user.create({ email: 'dock@mouse.com' })
    t.context.userId5 = userId5.toHexString()
    const session5 = await auth.user.createWebSession({ userId: t.context.userId5 })
    t.context.sessionId5 = session5.sessionId

    // a pkg that m4 owns that will not be changed
    const { id: pid1 } = await db.package.create({
      name: 'unc-bootcamp-project-a',
      registry: NPM,
      language: JAVASCRIPT
    })
    await db.package.update({
      packageId: pid1,
      maintainers: [{ userId: t.context.userId4, revenuePercent: 100 }]
    })

    // a pkg that m1 owns and npm will confirm
    const { id: yttriumId } = await db.package.create({
      name: 'yttrium-server',
      registry: NPM,
      language: JAVASCRIPT
    })
    await db.package.update({
      packageId: yttriumId,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }]
    })
    t.context.yttriumId = yttriumId.toHexString()

    // a pkg that is in the db that m1 currently maintains but that npm
    // will say m1 no longer maintains
    const { id: sodium } = await db.package.create({
      name: 'sodium-native',
      registry: NPM,
      language: JAVASCRIPT
    })
    await db.package.update({
      packageId: sodium,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }]
    })
    t.context.sodium = sodium.toHexString()

    // a pkg that is co-maintained, but npm will say maintainer1 no longer
    // maintains it; the surviving maintainer should remain and get 100%
    const { id: papajohns } = await db.package.create({
      name: 'papajohns',
      registry: NPM,
      language: JAVASCRIPT
    })
    await db.package.update({
      packageId: papajohns,
      maintainers: [
        { userId: t.context.userId3, revenuePercent: 50 },
        { userId: t.context.userId1, revenuePercent: 50 }
      ]
    })
    t.context.papajohns = papajohns.toHexString()

    // a pkg that is in the db that m1 does not maintain but
    // that npm will say m1 now maintains
    const { id: chive } = await db.package.create({
      name: 'chive',
      registry: NPM,
      language: JAVASCRIPT
    })
    await db.package.update({
      packageId: chive,
      maintainers: [{ userId: t.context.userId3, revenuePercent: 100 }]
    })
    t.context.chive = chive.toHexString()
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

test('PUT `/package/npm/refresh-ownership` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/npm/refresh-ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('PUT `/package/npm/refresh-ownership` 200 success', async (t) => {
  t.context.registry.npm.getOwnedPackages.resolves([
    'caesar', // a new pkg
    'yttrium-server', // remains the same
    // 'sodium-native' is not here, so maintainership will be removed
    'chive' // in the db, but no currently marked as maintaining
    // 'papajohns' is not here, so surviving maintainer should get full revenue
  ])
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/npm/refresh-ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const caesar = await t.context.db.package.getByNameAndRegistry({
    name: 'caesar',
    registry: 'npm'
  })
  const yttrium = await t.context.db.package.get({ packageId: t.context.yttriumId })
  const sodium = await t.context.db.package.get({ packageId: t.context.sodium })
  const chive = await t.context.db.package.get({ packageId: t.context.chive })
  const papajohns = await t.context.db.package.get({ packageId: t.context.papajohns })

  // maintainers
  t.deepEqual(caesar.maintainers, [
    { userId: t.context.userId1, revenuePercent: 100 }
  ])
  t.deepEqual(yttrium.maintainers, [
    { userId: t.context.userId1, revenuePercent: 100 }
  ])
  t.deepEqual(sodium.maintainers, [])
  t.deepEqual(chive.maintainers, [
    { userId: t.context.userId3, revenuePercent: 100 },
    { userId: t.context.userId1, revenuePercent: 0 }
  ])
  t.deepEqual(papajohns.maintainers, [
    { userId: t.context.userId3, revenuePercent: 100 }
  ])
})

test('PUT `/package/npm/refresh-ownership` 400 bad request | no npm info', async (t) => {
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/npm/refresh-ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId5}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('PUT `/package/npm/refresh-ownership` 500 server error', async (t) => {
  t.context.db.user.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'PUT',
    url: '/package/npm/refresh-ownership',
    payload: {},
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
