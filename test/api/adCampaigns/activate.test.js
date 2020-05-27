const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const advertiserId1 = await db.advertiser.create({
      advertiser: {
        name: 'Honesty',
        email: 'honey@etsy.com',
        password: 'beekeeperbookkeeper'
      }
    })
    t.context.advertiserId1 = advertiserId1.toHexString()
    t.context.sessionId = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId1 })

    t.context.adId1 = await db.advertiser.createAdDraft({
      advertiserId: t.context.advertiserId1,
      draft: {
        name: 'Teacher Fund #1',
        title: 'Teacher Fund',
        body: 'You donate, we donate.',
        url: 'teacherfund.com'
      }
    })
    t.context.adId2 = await db.advertiser.createAdDraft({
      advertiserId: t.context.advertiserId1,
      draft: {
        name: 'Teacher Fund #2',
        title: 'Teacher Fund 2',
        body: 'You donate, we donate. 2',
        url: 'teacherfund.com 2'
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

test.after.always(async (t) => {
  await after(t)
})

test('POST `/ad-campaign/activate` 401 unauthorized no session', async (t) => {
  const adCampaignId = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain 1'
    },
    adIdsFromDrafts: [t.context.adId1],
    keepDrafts: true
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/activate` 200 success', async (t) => {
  const adCampaignId1 = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain 2'
    },
    adDrafts: [t.context.adId2],
    keepDrafts: true
  })
  await t.context.db.advertiser.approveAdCampaign({
    advertiserId: t.context.advertiserId1,
    campaignId: adCampaignId1
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId: adCampaignId1 },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const campaign = await t.context.db.advertiser.getAdCampaign({
    advertiserId: t.context.advertiserId1,
    campaignId: adCampaignId1
  })
  t.true(campaign.active)
})

test('POST `/ad-campaign/activate` 400 bad request | unapproved campaign', async (t) => {
  const newAdCampaignId = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      ads: [{
        name: 'blah',
        title: 'arg',
        body: 'ugh',
        url: 'ugh.com'
      }],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain 3'
    }
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId: newAdCampaignId },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/activate` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: {},
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/activate` 500 server error', async (t) => {
  t.context.db.advertiser.getAdCampaign = () => { throw new Error('poop') }
  const adCampaignId = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain 2'
    },
    adDrafts: [t.context.adId2],
    keepDrafts: true
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
