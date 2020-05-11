const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const advertiserId = await db.advertiser.createAdvertiser({
      advertiser: {
        name: 'Honesty',
        email: 'honey1@etsy.com',
        password: 'beekeeperbookkeeper'
      }
    })
    t.context.advertiserId = advertiserId.toHexString()

    const { registrationToken } = await auth.advertiser.beginRegistration({ email: 'honey1@etsy.com' })
    t.context.token = registrationToken
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('POST `/advertiser/verify` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'honey1@etsy.com', token: 'token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/verify` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'honey1@etsy.com', token: t.context.token }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.advertiser.getAdvertiser({
    advertiserId: t.context.advertiserId
  })
  t.true(advertiser.verified)
})

test('POST `/advertiser/verify` 200 success | email case does not matter', async (t) => {
  const { db, auth } = t.context
  const advertiserId = (await db.advertiser.createAdvertiser({
    advertiser: {
      firstName: 'Papa',
      lastName: 'John',
      email: 'papa@papajohns.com',
      password: 'pizza4life'
    }
  })).toHexString()
  const { registrationToken } = await auth.advertiser.beginRegistration({ email: 'papa@papajohns.com' })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'Papa@PapaJohns.COM', token: registrationToken }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.advertiser.getAdvertiser({ advertiserId })
  t.true(advertiser.verified)
})

test('POST `/advertiser/verify` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { token: 'token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/verify` 500 server error', async (t) => {
  const { db, auth } = t.context
  await db.advertiser.createAdvertiser({
    advertiser: {
      firstName: 'Papa',
      lastName: 'John',
      email: 'papa_113355@papajohns.com',
      password: 'pizza4life'
    }
  })
  const { registrationToken } = await auth.advertiser.beginRegistration({ email: 'papa_113355@papajohns.com' })
  db.advertiser.verifyAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/verify',
    body: { email: 'papa_113355@papajohns.com', token: registrationToken }
  })
  t.deepEqual(res.statusCode, 500)
})
