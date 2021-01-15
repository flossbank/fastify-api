const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()
    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.session1 = session1.sessionId

    // user with no packages
    const { id: userId2 } = await db.user.create({ email: 'bear@etsy.com' })
    t.context.userId2 = userId2.toHexString()
    const session2 = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.session2 = session2.sessionId

    // user co-maintaining a pkg
    const { id: userId3 } = await db.user.create({ email: 'robin@etsy.com' })
    t.context.userId3 = userId3.toHexString()
    const session3 = await auth.user.createWebSession({ userId: t.context.userId3 })
    t.context.session3 = session3.sessionId

    // pkg maintained only by user id 1
    const { id: yttriumId } = await db.package.create({
      name: 'yttrium-server',
      registry: 'npm',
      language: 'javascript'
    })
    await db.package.update({
      packageId: yttriumId,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }]
    })

    // pkg maintained only by user id 1 (different lang/reg than the first)
    const { id: sodium } = await db.package.create({
      name: 'sodium',
      registry: 'rubygems',
      language: 'ruby'
    })
    await db.package.update({
      packageId: sodium,
      maintainers: [{ userId: t.context.userId1, revenuePercent: 100 }]
    })

    // pkg maintained by user id 1 and 2
    const { id: papajohns } = await db.package.create({
      name: 'papajohns',
      registry: 'npm',
      language: 'javascript'
    })
    await db.package.update({
      packageId: papajohns,
      maintainers: [
        { userId: t.context.userId3, revenuePercent: 50 },
        { userId: t.context.userId1, revenuePercent: 50 }
      ]
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

test('GET `/maintainer/owned-packages` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/owned-packages` 200 success | all packages', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: [
      {
        language: 'javascript',
        name: 'yttrium-server',
        registry: 'npm'
      },
      {
        language: 'ruby',
        name: 'sodium',
        registry: 'rubygems'
      },
      {
        language: 'javascript',
        name: 'papajohns',
        registry: 'npm'
      }
    ]
  })
})

test('GET `/maintainer/owned-packages` 200 success | filtered', async (t) => {
  // only npm please
  let res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    query: { registry: 'npm' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: [
      {
        language: 'javascript',
        name: 'yttrium-server',
        registry: 'npm'
      },
      {
        language: 'javascript',
        name: 'papajohns',
        registry: 'npm'
      }
    ]
  })

  // only c++ please
  res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    query: { language: 'ruby' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: [
      {
        language: 'ruby',
        name: 'sodium',
        registry: 'rubygems'
      }
    ]
  })
})

test('GET `/maintainer/owned-packages` 400 bad request | invalid reg/lang', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    query: { registry: 'garbage' },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/maintainer/owned-packages` 200 success | nothing to see here', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session2}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: []
  })
})

test('GET `/maintainer/owned-packages` 500 server error', async (t) => {
  t.context.db.package.getOwnedPackages = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/owned-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.session1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
