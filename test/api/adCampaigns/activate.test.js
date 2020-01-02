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

    t.context.ad1 = {
      name: 'unapproved ad',
      body: 'abc',
      title: 'ABC',
      url: 'https://abc.com'
    }

    t.context.ad2 = {
      name: 'approved ad',
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

test('POST `/ad-campaign/activate` 401 unauthorized no session', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [t.context.ad2],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 1'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/activate` 401 unauthorized req advertiser id bad', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: 'poop-advertiser-id',
    ads: [t.context.ad2],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 1'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/activate` 200 success', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [t.context.ad2],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  })).toHexString()
  let campaign = await t.context.db.getAdCampaign(adCampaignId)
  const adId2 = campaign.ads.map(ad => ad.id).pop()
  await t.context.db.approveAd(adCampaignId, adId2)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  campaign = await t.context.db.getAdCampaign(adCampaignId)
  t.true(campaign.active)
})

test('POST `/ad-campaign/activate` 400 bad request | invalid ads', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [t.context.ad2, t.context.ad1],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 3'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/activate` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/activate` 500 server error', async (t) => {
  t.context.db.getAdCampaign = () => { throw new Error() }
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [t.context.ad2],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
