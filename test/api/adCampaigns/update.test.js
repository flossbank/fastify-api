const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId1 = advertiserId1.toHexString()

    const advertiserId2 = await db.createAdvertiser({
      name: 'Faith Ogler',
      email: 'fogler@folgers.coffee',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId2 = advertiserId2.toHexString()

    t.context.adId1 = await db.createAd(advertiserId1, {
      name: 'Teacher Fund #1',
      title: 'Teacher Fund',
      body: 'You donate, we donate.',
      url: 'teacherfund.com'
    })
    t.context.adId2 = await db.createAd(advertiserId1, {
      name: 'Teacher Fund #2',
      title: 'Teacher Fund 2',
      body: 'You donate, we donate. 2',
      url: 'teacherfund.com 2'
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
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 1'
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId: adCampaignIdBlah,
      adCampaign: {
        ads: [t.context.adId1],
        maxSpend: 1000,
        cpm: 100,
        name: 'camp pain 1'
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/update` 200 success', async (t) => {
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [t.context.adId1],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  })

  let campaign = await t.context.db.getAdCampaign(t.context.advertiserId1, adCampaignId)
  await t.context.db.approveAd(t.context.advertiserId1, adCampaignId, t.context.adId1)
  await t.context.db.activateAdCampaign(t.context.advertiserId1, adCampaignId)
  campaign = await t.context.db.getAdCampaign(t.context.advertiserId1, adCampaignId)

  const newName = 'new camp pain 2'
  const updatedCampaign = Object.assign(campaign, {
    ads: [...campaign.ads.map((ad) => ad.id), t.context.adId2],
    name: newName
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: updatedCampaign
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(JSON.parse(res.payload), { success: true })
  t.deepEqual(res.statusCode, 200)

  const campaignAfterUpdate = await t.context.db.getAdCampaign(t.context.advertiserId1, adCampaignId)
  t.deepEqual(campaignAfterUpdate.ads.length, 2)
  t.true(campaignAfterUpdate.ads.every(ad => !!ad.id))
  t.true(campaignAfterUpdate.ads.find(ad => ad.id === t.context.adId1).approved)
  t.deepEqual(campaignAfterUpdate.name, newName)
  t.deepEqual(campaignAfterUpdate.active, false)
})

test('POST `/ad-campaign/update` 400 bad request | invalid ads', async (t) => {
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp paign'
  })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        ads: { halp: 'me' },
        maxSpend: 1000,
        cpm: 100,
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
    maxSpend: 1000,
    cpm: 100,
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
        maxSpend: 1000,
        cpm: 100,
        name: 'camp pain 3'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
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
    maxSpend: 1000,
    cpm: 100,
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
        maxSpend: 1000,
        cpm: 100,
        name: 'camp pain'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
