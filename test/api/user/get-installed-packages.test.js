const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

const testPkgs = (userId) => [
  {
    language: 'javascript',
    name: 'fastify-formbody',
    registry: 'npm',
    installs: [
      {
        userId: userId,
        sessionId: 'f1765a7f351b77f368071c5d611cf428',
        weight: 0.05555555555555555,
        timestamp: 1587494171005
      },
      {
        userId: userId,
        sessionId: '4ab02fceb5c738c2564bbd53a312de00',
        weight: 0.037037037037037035,
        timestamp: 1587595800091
      }
    ]
  }, {
    language: 'javascript',
    name: 'ulid',
    registry: 'npm',
    installs: [
      {
        userId: userId,
        sessionId: 'f1765a7f351b77f368071c5d611cf428',
        weight: 0.16666666666666666,
        timestamp: 1587494171005
      },
      {
        userId: '5e87cd5dc647f344fc8fa586',
        sessionId: '1a22e47613b0544e186c1df84e0333ca',
        weight: 0.03333333333333333,
        timestamp: 1587589466347
      },
      {
        userId: userId,
        sessionId: '4ab02fceb5c738c2564bbd53a312de00',
        weight: 0.1111111111111111,
        timestamp: 1587595800091
      },
      {
        userId: '5e9cc640c647f344fc8fa58a',
        sessionId: 'f477eb55e2dabd5080d6da61fd1c08993ea203dc799da6a8200d37accd917ea0',
        weight: 0.03333333333333333,
        timestamp: 1590703139808
      },
      {
        userId: userId,
        sessionId: '0f2aa2c0f699c9a97e0fac8c95fb6e28332bb47b970ee4f168be41bdbadb09df',
        weight: 0.03333333333333333,
        timestamp: 1590794637978
      }
    ]
  }, {
    language: 'javascript',
    name: 'fastify-helmet',
    registry: 'npm',
    installs: [
      {
        userId: userId,
        sessionId: 'f1765a7f351b77f368071c5d611cf428',

        weight: 0.010416666666666666,
        timestamp: 1587494171005
      },
      {
        userId: '5e87cd5dc647f344fc8fa586',
        sessionId: 'e4aa813ffea993ed4d4accd5c6f3ade9',

        weight: 0.0020833333333333333,
        timestamp: 1587590938021
      },
      {
        userId: userId,
        sessionId: 'd73539172c6b1ba9a960f3d358ad694a',

        weight: 0.0020161290322580645,
        timestamp: 1588287352863
      },
      {
        userId: '5e9cc640c647f344fc8fa58a',
        sessionId: 'f477eb55e2dabd5080d6da61fd1c08993ea203dc799da6a8200d37accd917ea0',
        weight: 0.0020833333333333333,
        timestamp: 1590703139808
      },
      {
        userId: userId,
        sessionId: '0f2aa2c0f699c9a97e0fac8c95fb6e28332bb47b970ee4f168be41bdbadb09df',
        weight: 0.0020833333333333333,
        timestamp: 1590794637978
      }
    ]
  }
]

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com' })
    t.context.userId1 = userId1.toHexString()

    const session1 = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionId1 = session1.sessionId

    for (const pkg of testPkgs(t.context.userId1)) {
      await db.package.create({ pkg })
    }
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

test('GET `/user/get-installed-packages` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-installed-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/user/get-installed-packages` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-installed-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  // sort so we can make assertions (output order is undefined)
  payload.installedPackages.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  t.deepEqual(payload, {
    success: true,
    installedPackages: [
      {
        language: 'javascript',
        name: 'fastify-formbody',
        registry: 'npm',
        installCount: 2
      }, {
        language: 'javascript',
        name: 'fastify-helmet',
        registry: 'npm',
        installCount: 3
      },
      {
        language: 'javascript',
        name: 'ulid',
        registry: 'npm',
        installCount: 3
      }
    ]
  })
})

test('GET `/user/get-installed-packages` 500 server error', async (t) => {
  t.context.db.package.getUserInstalledPackages = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-installed-packages',
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
