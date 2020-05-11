const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

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

    // active campaign
    t.context.campaignId1 = await db.advertiser.createAdCampaign({
      advertiserId: t.context.advertiserId1,
      adCampaign: {
        ads: [],
        maxSpend: 100,
        cpm: 100,
        name: 'camp pain 1'
      },
      adIdsFromDrafts: [t.context.adId1, t.context.adId2],
      keepDrafts: true
    })
    await db.advertiser.approveAdCampaign({ advertiserId: t.context.advertiserId1, campaignId: t.context.campaignId1 })
    await db.advertiser.activateAdCampaign({ advertiserId: t.context.advertiserId1, campaignId: t.context.campaignId1 })
    t.context.adCampaign1 = await db.advertiser.getAdCampaign({ advertiserId: t.context.advertiserId1, campaignId: t.context.campaignId1 })

    // inactive campaign
    t.context.campaignId2 = await db.advertiser.createAdCampaign({
      advertiserId: t.context.advertiserId1,
      adCampaign: {
        ads: [],
        maxSpend: 100,
        cpm: 100,
        name: 'camp pain 2'
      },
      adIdsFromDrafts: [t.context.adId1, t.context.adId2],
      keepDrafts: true
    })

    await auth.user.cacheApiKey({ apiKey: 'the-best-api-key', userId: 'user-id1' })
    await auth.user.cacheApiKey({ apiKey: 'no-ads-key', userId: 'user-id2' })
    await auth.user.cacheApiKeyNoAdsSetting({ apiKey: 'no-ads-key', noAds: true })
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

test('POST `/session/start` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer Dov' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/session/start` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer the-best-api-key' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.true(payload.sessionId.length > 0)

  t.context.adCampaign1.ads.forEach((ad) => {
    const id = `${t.context.advertiserId1}_${t.context.campaignId1}_${ad.id}`
    t.deepEqual(
      payload.ads.find(payloadAd => payloadAd.id === id),
      { id, title: ad.title, body: ad.body, url: ad.url }
    )
  })
})

test('POST `/session/start` 200 success | no ads available still gets a session', async (t) => {
  t.context.db.ad.getBatch = () => []
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer the-best-api-key' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.true(payload.sessionId.length > 0)
})

test('POST `/session/start` 200 success | existing session', async (t) => {
  const res1 = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer the-best-api-key' }
  })

  let payload = JSON.parse(res1.payload)
  const sessionId = payload.sessionId

  const res2 = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: { sessionId },
    headers: { authorization: 'Bearer the-best-api-key' }
  })

  t.deepEqual(res2.statusCode, 200)
  payload = JSON.parse(res2.payload)
  t.deepEqual(payload.sessionId, sessionId)

  t.context.adCampaign1.ads.forEach((ad) => {
    const id = `${t.context.advertiserId1}_${t.context.campaignId1}_${ad.id}`
    t.deepEqual(
      payload.ads.find(payloadAd => payloadAd.id === id),
      { id, title: ad.title, body: ad.body, url: ad.url }
    )
  })
})

test('POST `/session/start` 200 success | no ads', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer no-ads-key' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.ads, [])
})

test('POST `/session/start` 500 server error', async (t) => {
  t.context.db.ad.getBatch = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer the-best-api-key' }
  })
  t.deepEqual(res.statusCode, 500)
})
