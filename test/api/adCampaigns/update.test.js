const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { AD_NOT_CLEAN_MSG } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId1 = advertiserId1.toHexString()
    t.context.adId1 = await db.createAdDraft(advertiserId1, {
      name: 'Teacher Fund #1',
      title: 'Teacher Fund',
      body: 'You donate, we donate.',
      url: 'teacherfund.com'
    })
    t.context.adId2 = await db.createAdDraft(advertiserId1, {
      name: 'Teacher Fund #2',
      title: 'Teacher Fund 2',
      body: 'You donate, we donate. 2',
      url: 'teacherfund.com 2'
    })

    const advertiserId2 = await db.createAdvertiser({
      name: 'Faith Ogler',
      email: 'fogler@folgers.coffee',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId2 = advertiserId2.toHexString()
    t.context.adId3 = await db.createAdDraft(advertiserId2, {
      name: 'Teacher Fund #3',
      title: 'Teacher Fund 3',
      body: 'You donate, we donate. 3',
      url: 'teacherfund.com 3'
    })
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.getUISession.resolves({
    advertiserId: t.context.advertiserId1
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('POST `/ad-campaign/update` 401 unauthorized | no session', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const adCampaignIdBlah = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 1'
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId: adCampaignIdBlah,
      adCampaign: {
        ads: [],
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain 1'
      },
      adDrafts: [t.context.adId1]
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/update` 200 success with ad draft and keep drafts', async (t) => {
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [],
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 2'
  }, [t.context.adId1], true)

  await t.context.db.approveAdCampaign(t.context.advertiserId1, adCampaignId)
  await t.context.db.activateAdCampaign(t.context.advertiserId1, adCampaignId)
  const campaign = await t.context.db.getAdCampaign(t.context.advertiserId1, adCampaignId)

  const newName = 'new camp pain 2'
  const updatedCampaign = Object.assign(campaign, {
    name: newName
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: updatedCampaign,
      adDrafts: [t.context.adId2],
      keepDrafts: true
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(JSON.parse(res.payload), { success: true })
  t.deepEqual(res.statusCode, 200)

  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId1)
  // Should not have deleted the draft so we should still have 2 that were created in setup
  t.deepEqual(advertiser.adDrafts.length, 2)

  const campaignAfterUpdate = advertiser.adCampaigns.find(camp => camp.id === adCampaignId)
  // Campaign should have the initial ad plus the new ad from drafts we just added
  t.deepEqual(campaignAfterUpdate.ads.length, 2)
  t.true(campaignAfterUpdate.ads.every(ad => !!ad.id))
  t.deepEqual(campaignAfterUpdate.name, newName)
  t.deepEqual(campaignAfterUpdate.active, false)
})

test('POST `/ad-campaign/update` 200 success with ad draft and delete drafts', async (t) => {
  t.context.auth.getUISession.resolves({
    advertiserId: t.context.advertiserId2
  })
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId2, {
    ads: [],
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 2000'
  }, [], true)

  await t.context.db.approveAdCampaign(t.context.advertiserId2, adCampaignId)
  await t.context.db.activateAdCampaign(t.context.advertiserId2, adCampaignId)
  const campaign = await t.context.db.getAdCampaign(t.context.advertiserId2, adCampaignId)

  const newName = 'new camp pain 2'
  const updatedCampaign = Object.assign(campaign, {
    name: newName
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: updatedCampaign,
      adDrafts: [t.context.adId3],
      keepDrafts: false
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(JSON.parse(res.payload), { success: true })
  t.deepEqual(res.statusCode, 200)

  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId2)
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
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [],
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp paign'
  })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        ads: { halp: 'me' },
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain 3'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/update` 400 bad request | trash ads', async (t) => {
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [],
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 3'
  })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        ads: [{
          rent: 'is too damn high'
        }],
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain 3'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: AD_NOT_CLEAN_MSG })
})

test('POST `/ad-campaign/update` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: { adCampaignId: 'test-ad-campaign-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: { adCampaign: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/update` 500 server error', async (t) => {
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [],
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 3'
  })

  t.context.db.updateAdCampaign = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        ads: [],
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
