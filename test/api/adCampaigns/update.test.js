const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { MSGS, ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

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
    const session1 = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId1 })
    t.context.sessionId1 = session1.sessionId

    t.context.adId1 = await db.advertiser.createAdDraft({
      advertiserId: advertiserId1,
      draft: {
        name: 'Teacher Fund #1',
        title: 'Teacher Fund',
        body: 'You donate, we donate.',
        url: 'teacherfund.com'
      }
    })
    t.context.adId2 = await db.advertiser.createAdDraft({
      advertiserId: advertiserId1,
      draft: {
        name: 'Teacher Fund #2',
        title: 'Teacher Fund 2',
        body: 'You donate, we donate. 2',
        url: 'teacherfund.com 2'
      }
    })

    const advertiserId2 = await db.advertiser.create({
      advertiser: {
        name: 'Faith Ogler',
        email: 'fogler@folgers.coffee',
        password: 'beekeeperbookkeeper'
      }
    })
    t.context.advertiserId2 = advertiserId2.toHexString()
    const session2 = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId2 })
    t.context.sessionId2 = session2.sessionId
    t.context.adId3 = await db.advertiser.createAdDraft({
      advertiserId: advertiserId2,
      draft: {
        name: 'Teacher Fund #3',
        title: 'Teacher Fund 3',
        body: 'You donate, we donate. 3',
        url: 'teacherfund.com 3'
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

test('POST `/ad-campaign/update` 401 unauthorized | no session', async (t) => {
  const adCampaignIdBlah = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      maxSpend: 500000,
      cpm: 500000,
      name: 'camp pain 1'
    }
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaign: {
        id: adCampaignIdBlah,
        ads: [],
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain 1'
      },
      adDrafts: [t.context.adId1]
    },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/update` 200 success with ad draft and keep drafts', async (t) => {
  const adCampaignId = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      ads: [],
      maxSpend: 500000,
      cpm: 500000,
      name: 'camp pain 2'
    },
    adIdsFromDrafts: [t.context.adId1],
    keepDrafts: true
  })

  await t.context.db.advertiser.approveAdCampaign({
    advertiserId: t.context.advertiserId1,
    campaignId: adCampaignId
  })
  await t.context.db.advertiser.activateAdCampaign({
    advertiserId: t.context.advertiserId1,
    campaignId: adCampaignId
  })
  const campaign = await t.context.db.advertiser.getAdCampaign({
    advertiserId: t.context.advertiserId1,
    campaignId: adCampaignId
  })

  const newName = 'new camp pain 2'
  const updatedCampaign = Object.assign(campaign, {
    name: newName
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaign: updatedCampaign,
      adDrafts: [t.context.adId2],
      keepDrafts: true
    },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(JSON.parse(res.payload), { success: true })
  t.deepEqual(res.statusCode, 200)

  const advertiser = await t.context.db.advertiser.get({ advertiserId: t.context.advertiserId1 })
  // Should not have deleted the draft so we should still have 2 that were created in setup
  t.deepEqual(advertiser.adDrafts.length, 2)

  const campaignAfterUpdate = advertiser.adCampaigns.find(camp => camp.id === adCampaignId)
  // Campaign should have the initial ad plus the new ad from drafts we just added
  t.deepEqual(campaignAfterUpdate.ads.length, 2)
  t.true(campaignAfterUpdate.ads.every(ad => !!ad.id)) // every ad should have an id
  t.deepEqual(campaignAfterUpdate.name, newName)
  t.deepEqual(campaignAfterUpdate.active, false)
})

test('POST `/ad-campaign/update` 200 success with ad draft and delete drafts', async (t) => {
  const adCampaignId = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId2,
    adCampaign: {
      ads: [],
      maxSpend: 500000,
      cpm: 500000,
      name: 'camp pain 2000'
    },
    adDrafts: [],
    keepDrafts: true
  })

  await t.context.db.advertiser.approveAdCampaign({
    advertiserId: t.context.advertiserId2,
    campaignId: adCampaignId
  })
  await t.context.db.advertiser.activateAdCampaign({
    advertiserId: t.context.advertiserId2,
    campaignId: adCampaignId
  })
  const campaign = await t.context.db.advertiser.getAdCampaign({
    advertiserId: t.context.advertiserId2,
    campaignId: adCampaignId
  })

  const newName = 'new camp pain 2'
  const updatedCampaign = Object.assign(campaign, {
    name: newName
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaign: updatedCampaign,
      adDrafts: [t.context.adId3],
      keepDrafts: false
    },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
    }
  })
  t.deepEqual(JSON.parse(res.payload), { success: true })
  t.deepEqual(res.statusCode, 200)

  const advertiser = await t.context.db.advertiser.get({
    advertiserId: t.context.advertiserId2
  })
  // Should have deleted the draft so we should have 0
  t.deepEqual(advertiser.adDrafts.length, 0)

  const campaignAfterUpdate = advertiser.adCampaigns.find(camp => camp.id === adCampaignId)
  // Campaign should have the initial ad plus the new ad from drafts we just added
  t.deepEqual(campaignAfterUpdate.ads.length, 1)
  t.true(campaignAfterUpdate.ads.every(ad => !!ad.id))
  t.deepEqual(campaignAfterUpdate.name, newName)
  t.deepEqual(campaignAfterUpdate.active, false)
})

test('POST `/ad-campaign/update` 400 bad request | invalid ads', async (t) => {
  const adCampaignId = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      ads: [],
      maxSpend: 500000,
      cpm: 500000,
      name: 'camp paign'
    }
  })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaign: {
        id: adCampaignId,
        ads: { halp: 'me' },
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain 3'
      }
    },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/update` 400 bad request | trash ads', async (t) => {
  const adCampaignId = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      ads: [],
      maxSpend: 500000,
      cpm: 500000,
      name: 'camp pain 3'
    }
  })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaign: {
        id: adCampaignId,
        ads: [{
          name: 'rent is too damn high',
          title: 'asdf' + String.fromCharCode(190), // ¾ -- a disallowed character; see helpers/clean.js
          body: 'fdas',
          url: 'fdas'
        }],
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain 3'
      }
    },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: MSGS.AD_NOT_CLEAN })
})

test('POST `/ad-campaign/update` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: { },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: { adCampaign: {} },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/update` 500 server error', async (t) => {
  const adCampaignId = await t.context.db.advertiser.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    adCampaign: {
      ads: [],
      maxSpend: 500000,
      cpm: 500000,
      name: 'camp pain 3'
    }
  })

  t.context.db.advertiser.updateAdCampaign = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaign: {
        id: adCampaignId,
        ads: [],
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain'
      }
    },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
