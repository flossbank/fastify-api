const test = require('ava')
const { advertiserSessionKey } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    })
    await db.updateAdvertiser(advertiserId1.toHexString(), {
      verified: true
    })
    await db.createAdvertiser({
      name: 'Faith Ogler',
      email: 'fogler@folgers.coffee',
      password: 'coffeesnobdoorknob'
    })
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

test('POST `/advertiser/login` 401 unauthorized | no account', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'petey@birdz.com', password: 'whatever' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/login` 401 unauthorized | wrong pwd', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'honey@etsy.com', password: 'wrongpassword' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/login` 401 unauthorized | unverified', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'fogler@folgers.coffee', password: 'coffeesnobdoorknob' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/login` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'honey@etsy.com', password: 'beekeeperbookkeeper' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(res.headers['set-cookie'], `${advertiserSessionKey}=advertiser-session`)
})

test('POST `/advertiser/login` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/login` 500 server error', async (t) => {
  t.context.db.authenticateAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'email', password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 500)
})
