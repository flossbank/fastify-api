const test = require('ava')
const { ADVERTISER_SESSION_KEY } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper',
      organization: 'elf-world'
    })
    t.context.advertiserId = advertiserId1.toHexString()
    await db.verifyAdvertiser('honey@etsy.com')
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.advertiser.getWebSession.resolves({
    advertiserId: t.context.advertiserId
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('GET `/advertiser/resume` 401 unauthorized | no session', async (t) => {
  t.context.auth.advertiser.getWebSession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/resume',
    headers: {
      cookie: `${ADVERTISER_SESSION_KEY}=advertiser-session`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/advertiser/resume` 200 | success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/resume',
    headers: {
      cookie: `${ADVERTISER_SESSION_KEY}=advertiser-session`
    }
  })
  const advertiserRetrieved = await t.context.db.getAdvertiser(t.context.advertiserId)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.success, true)
  t.deepEqual(payload.advertiser, { ...advertiserRetrieved, id: advertiserRetrieved.id.toHexString() })
  t.deepEqual(res.statusCode, 200)
})

test('GET `/advertiser/resume` 400 | no advertiser', async (t) => {
  t.context.db.getAdvertiser = () => undefined
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/resume',
    headers: {
      cookie: `${ADVERTISER_SESSION_KEY}=advertiser-session`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/advertiser/resume` 500 | advertiser query error', async (t) => {
  t.context.db.getAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/advertiser/resume',
    headers: {
      cookie: `${ADVERTISER_SESSION_KEY}=advertiser-session`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
