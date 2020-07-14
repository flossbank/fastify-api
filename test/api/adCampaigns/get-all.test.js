const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const advertiserId1 = (await db.advertiser.create({
      advertiser: {
        name: 'Honesty',
        email: 'honey@etsy.com',
        password: 'beekeeperbookkeeper'
      }
    }))
    t.context.advertiserId1 = advertiserId1.toHexString()
    const session = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId1 })
    t.context.sessionId = session.sessionId

    t.context.campaignId1 = await db.advertiser.createAdCampaign({
      advertiserId: t.context.advertiserId1,
      adCampaign: {
        maxSpend: 100,
        cpm: 100,
        name: 'camp pain'
      }
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

test('GET `/ad-campaign/get-all` 401 unauthorized | no session', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get-all',
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/ad-campaign/get-all` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get-all',
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    adCampaigns: [
      {
        id: t.context.campaignId1,
        ads: [],
        maxSpend: 100,
        approved: false,
        cpm: 100,
        name: 'camp pain',
        active: false
      }
    ]
  })
})

test('GET `/ad-campaign/get-all` 500 server error', async (t) => {
  t.context.db.advertiser.getAdCampaignsForAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get-all',
    query: { advertiserId: t.context.advertiserId1 },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
