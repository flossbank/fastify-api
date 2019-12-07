const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const maintainerId1 = await db.createMaintainer({
      name: 'Pete',
      email: 'pete@flossbank.com',
      password: 'petespass',
      tokens: {
        npm: 'pete-token'
      }
    })
    t.context.maintainerId1 = maintainerId1.toHexString()

    const maintainerId2 = await db.createMaintainer({
      name: 'Goelle',
      email: 'goelle@flossbank.com',
      password: 'cami42069',
      tokens: {
        npm: 'goelle-token'
      }
    })
    t.context.maintainerId2 = maintainerId2.toHexString()

    const maintainerId3 = await db.createMaintainer({
      name: 'Kelvin Moore Lando Calrissian',
      email: 'kmoorlando7@gmail.com',
      password: 'ashes2ashes',
      tokens: {
        npm: 'kelv-token'
      }
    })
    t.context.maintainerId3 = maintainerId3.toHexString()

    const maintainerId4 = await db.createMaintainer({
      name: 'Steffen Dodges',
      email: 'dodgeball@hotmail.com',
      password: 'john316',
      tokens: {
        npm: 'steffen-token'
      }
    })
    t.context.maintainerId4 = maintainerId4.toHexString()

    const maintainerId5 = await db.createMaintainer({
      name: 'Hickory Dickory',
      email: 'dock@mouse.com',
      password: 'cheeze',
      tokens: {}
    })
    t.context.maintainerId4 = maintainerId5.toHexString()

    // a pkg that m4 owns that will not be changed
    await db.createPackage({
      name: 'unc-bootcamp-project-a',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId4,
      maintainers: [{ maintainerId: t.context.maintainerId4, revenuePercent: 100 }]
    })

    // a pkg that m1 owns and npm will confirm
    const yttriumId = await db.createPackage({
      name: 'yttrium-server',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId1,
      maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
    })
    t.context.yttriumId = yttriumId.toHexString()

    // a pkg that is in the db that m1 currently maintains and does not own
    // but that npm will say m1 now owns
    const jsDeepEquals = await db.createPackage({
      name: 'js-deep-equals',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId2,
      maintainers: [
        { maintainerId: t.context.maintainerId1, revenuePercent: 50 },
        { maintainerId: t.context.maintainerId1, revenuePercent: 50 }
      ]
    })
    t.context.jsDeepEquals = jsDeepEquals.toHexString()

    // a pkg that is in the db that m1 currently owns but that npm
    // will say m1 no longer owns
    const sodium = await db.createPackage({
      name: 'sodium-native',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId1,
      maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
    })
    t.context.sodium = sodium.toHexString()

    // a pkg that is in the db that m1 does not maintain and does not own
    // but that npm will say m1 now owns
    const chive = await db.createPackage({
      name: 'chive',
      registry: 'npm',
      totalRevenue: 10,
      owner: t.context.maintainerId3,
      maintainers: [{ maintainerId: t.context.maintainerId3, revenuePercent: 100 }]
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

test.failing('POST `/package/refresh` 401 unauthorized', async (t) => {
  t.context.registry.npm.getOwnedPackages.resolves(['unc-bootcamp-project-a'])
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: t.context.maintainerId4,
      packageRegistry: 'npm'
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/package/refresh` 200 success', async (t) => {
  t.context.registry.npm.getOwnedPackages.resolves([
    'yttrium-server', // remains the same
    'js-deep-equals', // new ownership, already maintaining
    // 'sodium-native' is not here
    'chive' // new ownership, not currently a maintainer
  ])
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: t.context.maintainerId1,
      packageRegistry: 'npm'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const yttrium = await t.context.db.getPackage(t.context.yttriumId)
  const jsDeepEquals = await t.context.db.getPackage(t.context.jsDeepEquals)
  const sodium = await t.context.db.getPackage(t.context.sodium)
  const chive = await t.context.db.getPackage(t.context.chive)

  // ownership
  t.deepEqual(yttrium.owner, t.context.maintainerId1)
  t.deepEqual(jsDeepEquals.owner, t.context.maintainerId1)
  t.deepEqual(sodium.owner, null)
  t.deepEqual(chive.owner, t.context.maintainerId1)

  // maintainers
  t.deepEqual(yttrium.maintainers, [
    { maintainerId: t.context.maintainerId1, revenuePercent: 100 }
  ])
  t.deepEqual(jsDeepEquals.maintainers, [
    { maintainerId: t.context.maintainerId1, revenuePercent: 50 },
    { maintainerId: t.context.maintainerId1, revenuePercent: 50 }
  ])
  t.deepEqual(sodium.maintainers, [])
  t.deepEqual(chive.maintainers, [
    { maintainerId: t.context.maintainerId3, revenuePercent: 100 },
    { maintainerId: t.context.maintainerId1, revenuePercent: 0 }
  ])
})

test('POST `/package/refresh` 400 bad request | not a maintainer', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: '000000000000',
      packageRegistry: 'npm'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 400 bad request | no tokens', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: t.context.maintainerId5,
      packageRegistry: 'npm'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: { maintainerId: 'test-maintainer-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: t.context.maintainerId4,
      packageRegistry: 'github.com'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 500 server error', async (t) => {
  t.context.db.refreshPackageOwnership = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {
      maintainerId: t.context.maintainerId1,
      packageRegistry: 'npm'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
