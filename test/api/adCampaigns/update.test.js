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

    t.context.ad1 = {
      name: 'ad #1',
      body: 'abc',
      title: 'ABC',
      url: 'https://abc.com'
    }

    t.context.ad2 = {
      name: 'ad #2',
      body: 'def',
      title: 'DEF',
      url: 'https://def.com'
    }
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
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 1'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        advertiserId: t.context.advertiserId1,
        ads: [t.context.ad1],
        maxSpend: 1000,
        cpm: 100,
        name: 'camp pain 1'
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/update` 401 unauthorized | bad advertiser id', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 1'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        advertiserId: 'poopie',
        ads: [t.context.ad1],
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
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [t.context.ad1],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  })).toHexString()

  await t.context.db.activateAdCampaign(adCampaignId)

  let campaign = await t.context.db.getAdCampaign(adCampaignId)
  const adId1 = campaign.ads.map(ad => ad.id).pop()
  await t.context.db.approveAd(adCampaignId, adId1)
  campaign = await t.context.db.getAdCampaign(adCampaignId)

  const newName = 'new camp pain 2'
  const updatedCampaign = Object.assign(campaign, {
    ads: [...campaign.ads, t.context.ad2],
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
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  campaign = await t.context.db.getAdCampaign(adCampaignId)
  t.deepEqual(campaign.ads.length, 2)
  t.true(campaign.ads.every(ad => !!ad.id))
  t.true(campaign.ads.find(ad => ad.id === adId1).approved)
  t.deepEqual(campaign.name, newName)
  t.deepEqual(campaign.active, false)
})

test('POST `/ad-campaign/update` 400 bad request | invalid ads', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 3'
  })).toHexString()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        advertiserId: t.context.advertiserId1,
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
  t.context.db.updateAdCampaign = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId: 'test-ad-campaign-0',
      adCampaign: {
        advertiserId: 'test-advertiser-0',
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
