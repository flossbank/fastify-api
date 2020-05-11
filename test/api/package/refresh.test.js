const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { MAINTAINER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const maintainerId1 = await db.createMaintainer({
      maintainer: {
        name: 'Pete',
        email: 'pete@flossbank.com',
        password: 'petespass',
        tokens: {
          npm: 'pete-token'
        }
      }
    })
    t.context.maintainerId1 = maintainerId1.toHexString()
    t.context.sessionId1 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId1 })

    const maintainerId2 = await db.createMaintainer({
      maintainer: {
        name: 'Goelle',
        email: 'goelle@flossbank.com',
        password: 'cami42069',
        tokens: {
          npm: 'goelle-token'
        }
      }
    })
    t.context.maintainerId2 = maintainerId2.toHexString()
    t.context.sessionId2 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId2 })

    const maintainerId3 = await db.createMaintainer({
      maintainer: {
        name: 'Kelvin Moore Lando Calrissian',
        email: 'kmoorlando7@gmail.com',
        password: 'ashes2ashes',
        tokens: {
          npm: 'kelv-token'
        }
      }
    })
    t.context.maintainerId3 = maintainerId3.toHexString()
    t.context.sessionId3 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId3 })

    const maintainerId4 = await db.createMaintainer({
      maintainer: {
        name: 'Steffen Dodges',
        email: 'dodgeball@hotmail.com',
        password: 'john316',
        tokens: {
          npm: 'steffen-token'
        }
      }
    })
    t.context.maintainerId4 = maintainerId4.toHexString()
    t.context.sessionId4 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId4 })

    const maintainerId5 = await db.createMaintainer({
      maintainer: {
        name: 'Hickory Dickory',
        email: 'dock@mouse.com',
        password: 'cheeze',
        tokens: {}
      }
    })
    t.context.maintainerId5 = maintainerId5.toHexString()
    t.context.sessionId5 = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId5 })

    // a pkg that m4 owns that will not be changed
    await db.createPackage({
      pkg: {
        name: 'unc-bootcamp-project-a',
        registry: 'npm',
        totalRevenue: 10,
        owner: t.context.maintainerId4,
        maintainers: [{ maintainerId: t.context.maintainerId4, revenuePercent: 100 }]
      }
    })

    // a pkg that m1 owns and npm will confirm
    const yttriumId = await db.createPackage({
      pkg: {
        name: 'yttrium-server',
        registry: 'npm',
        totalRevenue: 10,
        owner: t.context.maintainerId1,
        maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
      }
    })
    t.context.yttriumId = yttriumId.toHexString()

    // a pkg that is in the db that m1 currently maintains and does not own
    // but that npm will say m1 now owns
    const jsDeepEquals = await db.createPackage({
      pkg: {
        name: 'js-deep-equals',
        registry: 'npm',
        totalRevenue: 10,
        owner: t.context.maintainerId2,
        maintainers: [
          { maintainerId: t.context.maintainerId1, revenuePercent: 50 },
          { maintainerId: t.context.maintainerId1, revenuePercent: 50 }
        ]
      }
    })
    t.context.jsDeepEquals = jsDeepEquals.toHexString()

    // a pkg that is in the db that m1 currently owns but that npm
    // will say m1 no longer owns
    const sodium = await db.createPackage({
      pkg: {
        name: 'sodium-native',
        registry: 'npm',
        totalRevenue: 10,
        owner: t.context.maintainerId1,
        maintainers: [{ maintainerId: t.context.maintainerId1, revenuePercent: 100 }]
      }
    })
    t.context.sodium = sodium.toHexString()

    // a pkg that is in the db that m1 does not maintain and does not own
    // but that npm will say m1 now owns
    const chive = await db.createPackage({
      pkg: {
        name: 'chive',
        registry: 'npm',
        totalRevenue: 10,
        owner: t.context.maintainerId3,
        maintainers: [{ maintainerId: t.context.maintainerId3, revenuePercent: 100 }]
      }
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

test('POST `/package/refresh` 401 unauthorized', async (t) => {
  t.context.registry.npm.getOwnedPackages.resolves(['unc-bootcamp-project-a'])
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: { packageRegistry: 'npm' },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/package/refresh` 200 success', async (t) => {
  t.context.registry.npm.getOwnedPackages.resolves([
    'caesar', // a new pkg
    'yttrium-server', // remains the same
    'js-deep-equals', // new ownership, already maintaining
    // 'sodium-native' is not here
    'chive' // new ownership, not currently a maintainer
  ])
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: { packageRegistry: 'npm' },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const caesar = await t.context.db.getPackageByName({
    name: 'caesar',
    registry: 'npm'
  })
  const yttrium = await t.context.db.getPackage({ packageId: t.context.yttriumId })
  const jsDeepEquals = await t.context.db.getPackage({ packageId: t.context.jsDeepEquals })
  const sodium = await t.context.db.getPackage({ packageId: t.context.sodium })
  const chive = await t.context.db.getPackage({ packageId: t.context.chive })

  // ownership
  t.deepEqual(caesar.owner, t.context.maintainerId1)
  t.deepEqual(yttrium.owner, t.context.maintainerId1)
  t.deepEqual(jsDeepEquals.owner, t.context.maintainerId1)
  t.deepEqual(sodium.owner, null)
  t.deepEqual(chive.owner, t.context.maintainerId1)

  // maintainers
  t.deepEqual(caesar.maintainers, [
    { maintainerId: t.context.maintainerId1, revenuePercent: 100 }
  ])
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
  const sessionId = await t.context.auth.maintainer.createWebSession({ maintainerId: '000000000000' })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: { packageRegistry: 'npm' },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 400 bad request | no tokens', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: { packageRegistry: 'npm' },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId5}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: {},
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId5}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: { packageRegistry: 'github.com' },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId5}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/package/refresh` 500 server error', async (t) => {
  t.context.db.refreshPackageOwnership = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/package/refresh',
    payload: { packageRegistry: 'npm' },
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
