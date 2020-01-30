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
      name: 'Teacher Fund #5',
      title: 'Teacher Fund 5',
      body: 'You donate, we donate. 5',
      url: 'teacherfund.com 5'
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

test('POST `/ad-campaign/create` 401 unauthorized | no session', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: {
        ads: [],
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain 1'
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/create` 200 success with ad drafts and keeping drafts', async (t) => {
  const campaignToCreate = {
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 2'
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: campaignToCreate,
      adDrafts: [t.context.adId1, t.context.adId2],
      keepDrafts: true
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId1)
  // Should have kept advertiser drafts
  t.deepEqual(advertiser.adDrafts.length, 2)

  const campaign = advertiser.adCampaigns.find(camp => camp.id === id)
  t.deepEqual(campaign.ads.length, 2)
  t.deepEqual(campaign.approved, false)
  t.deepEqual(campaign.maxSpend, campaignToCreate.maxSpend)
  t.deepEqual(campaign.cpm, campaignToCreate.cpm)
  t.deepEqual(campaign.name, campaignToCreate.name)
})

test('POST `/ad-campaign/create` 200 success with ad drafts and removing drafts', async (t) => {
  t.context.auth.getUISession.resolves({
    advertiserId: t.context.advertiserId2
  })
  const campaignToCreate = {
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain from drafts'
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: campaignToCreate,
      adDrafts: [t.context.adId3]
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId2)
  // Should have deleted advertiser draft
  t.deepEqual(advertiser.adDrafts.length, 0)

  const campaign = advertiser.adCampaigns.find(camp => camp.id === id)
  t.deepEqual(campaign.ads.length, 1)
  t.deepEqual(campaign.approved, false)
  t.deepEqual(campaign.maxSpend, campaignToCreate.maxSpend)
  t.deepEqual(campaign.cpm, campaignToCreate.cpm)
  t.deepEqual(campaign.name, campaignToCreate.name)
})

test('POST `/ad-campaign/create` 200 success without ads', async (t) => {
  const campaignToCreate = {
    ads: [],
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 2'
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: campaignToCreate
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const campaign = await t.context.db.getAdCampaign(t.context.advertiserId1, id)
  t.deepEqual(campaign.name, campaignToCreate.name)
})

test('POST `/ad-campaign/create` 200 success with just new ads', async (t) => {
  const adToCreate = {
    name: 'Teacher Fund #3',
    title: 'Teacher Fund 3',
    body: 'Three\'s a crowd',
    url: 'teacherfund.com'
  }
  const campaignToCreate = {
    ads: [adToCreate],
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 2'
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: campaignToCreate
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const campaign = await t.context.db.getAdCampaign(t.context.advertiserId1, id)
  t.deepEqual(campaign.name, campaignToCreate.name)
  t.deepEqual(campaign.ads[0].name, adToCreate.name)
  t.deepEqual(campaign.ads.length, 1)
})

test('POST `/ad-campaign/create` 200 success with new ads and ad drafts where draft is preserved', async (t) => {
  const adToCreate = {
    name: 'Teacher Fund #4',
    title: 'Teacher Fund 4',
    body: 'Three\'s a crowd',
    url: 'teacherfund.com'
  }
  const campaignToCreate = {
    ads: [adToCreate],
    maxSpend: 500000,
    cpm: 500000,
    name: 'camp pain 2'
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: campaignToCreate,
      adDrafts: [t.context.adId1],
      keepDrafts: true
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId1)
  // should preserve ad drafts
  t.deepEqual(advertiser.adDrafts.length, 2)

  const campaign = advertiser.adCampaigns.find(camp => camp.id === id)
  t.deepEqual(campaign.name, campaignToCreate.name)
  // should create both the ad from the adDrafts as well as the new ad
  t.deepEqual(campaign.ads.length, 2)
})

test('POST `/ad-campaign/create` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: {
        cpm: 500000,
        name: 'camp pain'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: {
        maxSpend: 500000,
        name: 'camp pain'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: {
        maxSpend: 500000,
        cpm: 500000
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/create` 400 bad request | trash ads', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      adCampaign: {
        ads: [{
          name: 'trash ad',
          body: 'a\n\nbc',
          title: 'ABC',
          url: 'https://abc.com'
        }],
        maxSpend: 500000,
        cpm: 500000,
        name: 'camp pain'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: AD_NOT_CLEAN_MSG })
})

test('POST `/ad-campaign/create` 500 server error', async (t) => {
  t.context.db.createAdCampaign = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
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
