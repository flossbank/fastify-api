const test = require('ava')
const { ObjectId } = require('mongodb')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { USER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

const mockAdRevenue = [
  {
    userId: '5e83c1fe40e84654d6c75bd5',
    sessionId: 'd75ece87dd33ff87cd261e672c1092902999f8652eb9a3c9f76d4d81b24e299a',
    amount: 0.25,
    timestamp: 1590384893790
  },
  {
    userId: '5e83c1fe40e84654d6c75bf5',
    sessionId: 'd75ece87dd33ff87cd261e672c1092902999f8652eb9a3c9f76d4d81b24e299a',
    amount: 10.0,
    timestamp: 1590384893780
  }
]
const mockDonationRevenue = [
  {
    organizationId: '5f408f7f7311b720f775e162',
    amount: 37312.26185483995,
    timestamp: 1598475250862
  },
  {
    userId: '5f408f7f7311b720f775e165',
    amount: 20,
    timestamp: 1598475250810
  }
]

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: userId1 } = await db.user.create({ email: 'honey@etsy.com', username: 'peter' })
    t.context.userId1 = userId1.toHexString()

    const session = await auth.user.createWebSession({ userId: t.context.userId1 })
    t.context.sessionId = session.sessionId

    const { id: userId2 } = await db.user.create({ email: 'boo@etsy.com', username: 'joel' })
    t.context.userId2 = userId2.toHexString()

    const badSession = await auth.user.createWebSession({ userId: t.context.userId2 })
    t.context.unauthSessionId = badSession.sessionId

    const { id: packageId1 } = await db.package.create({
      name: 'flossbank',
      registry: 'npm',
      language: 'javascript',
      avatarUrl: 'blah.com'
    })
    t.context.packageId1 = packageId1.toString()
    await db.db.collection('packages').updateOne({
      _id: ObjectId(t.context.packageId1)
    }, {
      $set: {
        maintainers: [{
          userId: t.context.userId1,
          revenuePercent: 90
        },
        {
          userId: t.context.userId2,
          revenuePercent: 10
        }],
        adRevenue: mockAdRevenue,
        donationRevenue: mockDonationRevenue
      }
    })

    const { id: packageId2 } = await db.package.create({
      name: 'js-deep-equals',
      registry: 'rubygems',
      language: 'ruby',
      avatarUrl: 'blah.com'
    })
    t.context.packageIdNoRevenue = packageId2.toString()
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

test('GET `/package` 200 | unauthed | ad revenue and donation revenue', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package',
    query: {
      id: t.context.packageId1
    }
  })
  const packageFromDb = await t.context.db.package.get({ packageId: t.context.packageId1 })
  packageFromDb.id = packageFromDb.id.toString()
  delete packageFromDb.maintainers
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    package: {
      ...packageFromDb,
      adRevenue: mockAdRevenue.reduce((acc, v) => acc + v.amount, 0),
      donationRevenue: mockDonationRevenue.reduce((acc, v) => acc + v.amount, 0)
    }
  })
})

test('GET `/package` 200 | authed as maintainer', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package',
    query: {
      id: t.context.packageId1
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  const packageFromDb = await t.context.db.package.get({ packageId: t.context.packageId1 })
  packageFromDb.id = packageFromDb.id.toString()
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    package: {
      ...packageFromDb,
      adRevenue: mockAdRevenue.reduce((acc, v) => acc + v.amount, 0),
      donationRevenue: mockDonationRevenue.reduce((acc, v) => acc + v.amount, 0),
      maintainers: [
        {
          username: 'peter',
          revenuePercent: 90,
          userId: t.context.userId1
        },
        {
          username: 'joel',
          revenuePercent: 10,
          userId: t.context.userId2
        }
      ]
    }
  })
})

test('GET `/package` 200 | unauthed | user not in maintainer list', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package',
    query: {
      id: t.context.packageIdNoRevenue
    },
    headers: {
      cookie: `${USER_WEB_SESSION_COOKIE}=${t.context.unauthSessionId}`
    }
  })
  const packageFromDb = await t.context.db.package.get({ packageId: t.context.packageIdNoRevenue })
  packageFromDb.id = packageFromDb.id.toString()
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    package: {
      ...packageFromDb,
      adRevenue: 0,
      donationRevenue: 0
    }
  })
})

test('GET `/package` 200 | unauthed | no revenue', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package',
    query: {
      id: t.context.packageIdNoRevenue
    }
  })
  const packageFromDb = await t.context.db.package.get({ packageId: t.context.packageIdNoRevenue })
  packageFromDb.id = packageFromDb.id.toString()
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    package: {
      ...packageFromDb,
      adRevenue: 0,
      donationRevenue: 0
    }
  })
})

test('GET `/package` 404 no package', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package',
    query: {
      id: 'aaaaaaaaaaaa'
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('GET `/package` 500 error', async (t) => {
  t.context.db.package.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package',
    query: {
      id: t.context.packageId1
    }
  })
  t.deepEqual(res.statusCode, 500)
})
