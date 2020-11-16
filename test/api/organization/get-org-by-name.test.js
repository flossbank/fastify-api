const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const email = 'honey@etsy.com'
    const { id: userId1 } = await db.user.create({ email })
    t.context.userId1 = userId1.toHexString()

    const { id: orgId1 } = await db.organization.create({
      name: 'flossbank',
      host: 'GitHub',
      userId: t.context.userId1,
      avatarUrl: 'blah.com',
      email
    })
    t.context.orgId = orgId1.toString()
    t.context.orgName = 'flossbank'
    await db.organization.setDonation({ orgId: t.context.orgId, amount: 1000, globalDonation: false })
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

test('GET `/organization` send back org info', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization',
    query: {
      name: t.context.orgName,
      host: 'GitHub'
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    organization: {
      id: t.context.orgId,
      name: 'flossbank',
      globalDonation: false,
      donationAmount: 1000000,
      avatarUrl: 'blah.com'
    }
  })
})

test('GET `/organization` 404 no org', async (t) => {
  t.context.db.organization.getByNameAndHost = () => undefined
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization',
    query: {
      name: 'nonexistent',
      host: 'GitHub'
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('GET `/organization` 404 no org name, dont find undefined org', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization',
    query: {
      name: '',
      host: 'GitHub'
    }
  })
  t.deepEqual(res.statusCode, 404)
})

test('GET `/organization` 400 no host', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization',
    query: {
      name: 'nonexistent'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/organization` 500 error', async (t) => {
  t.context.db.organization.getByNameAndHost = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization',
    query: {
      name: t.context.orgName,
      host: 'GitHub'
    }
  })
  t.deepEqual(res.statusCode, 500)
})
