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
        maxSpend: 1000000,
        cpm: 100000,
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
        maxSpend: 1000000,
        cpm: 100000,
        name: 'camp pain 2'
      },
      adIdsFromDrafts: [t.context.adId1, t.context.adId2],
      keepDrafts: true
    })

    // now an ad that won't be seen because it's in a campaign with <100c cpm
    t.context.adId3 = await db.advertiser.createAdDraft({
      advertiserId: advertiserId1,
      draft: {
        name: 'Invisible Ad',
        title: 'Never Seen',
        body: '666',
        url: 'google.com'
      }
    })
    // active campaign with 70c CPM
    t.context.campaignId3 = await db.advertiser.createAdCampaign({
      advertiserId: t.context.advertiserId1,
      adCampaign: {
        ads: [],
        maxSpend: 100000,
        cpm: 70000,
        name: 'camp pain 3'
      },
      adIdsFromDrafts: [t.context.adId3],
      keepDrafts: true
    })
    await db.advertiser.approveAdCampaign({ advertiserId: t.context.advertiserId1, campaignId: t.context.campaignId3 })
    await db.advertiser.activateAdCampaign({ advertiserId: t.context.advertiserId1, campaignId: t.context.campaignId3 })
    t.context.adCampaign3 = await db.advertiser.getAdCampaign({ advertiserId: t.context.advertiserId1, campaignId: t.context.campaignId3 })

    // create some api keys to get the ads
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

test.skip('POST `/session/start` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer Dov' }
  })
  t.is(res.statusCode, 401)
})

test.skip('POST `/session/start` 401 unauthorized | no header', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {}
  })
  t.is(res.statusCode, 401)

  const res2 = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: {}
  })
  t.is(res2.statusCode, 401)
})

test.skip('POST `/session/start` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer the-best-api-key' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.true(payload.sessionId.length > 0)

  // first ad is an ethical ad (cli consumes array from tail :D)
  t.true(payload.ads[payload.ads.length - 1].id.includes('ETHICAL'))

  // flossbank ads were returned
  t.context.adCampaign1.ads.forEach((ad) => {
    const id = `${t.context.advertiserId1}_${t.context.campaignId1}_${ad.id}`
    t.deepEqual(
      payload.ads.find(payloadAd => payloadAd.id === id),
      { id, title: ad.title, body: ad.body, url: ad.url }
    )
  })

  // ad in campaign with small cpm was not returned
  t.context.adCampaign3.ads.forEach((ad) => {
    const id = `${t.context.advertiserId1}_${t.context.campaignId3}_${ad.id}`
    t.true(!payload.ads.some(payloadAd => payloadAd.id === id))
  })
})

test.skip('POST `/session/start` 200 success | ethical ads is down', async (t) => {
  t.context.ethicalAds.got = () => { throw new Error() }

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer the-best-api-key' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.true(payload.sessionId.length > 0)

  // no ethical ads
  t.true(!payload.ads.some(ad => ad.id.includes('ETHICAL')))

  // flossbank ads were returned
  t.context.adCampaign1.ads.forEach((ad) => {
    const id = `${t.context.advertiserId1}_${t.context.campaignId1}_${ad.id}`
    t.deepEqual(
      payload.ads.find(payloadAd => payloadAd.id === id),
      { id, title: ad.title, body: ad.body, url: ad.url }
    )
  })

  // ad in campaign with small cpm was not returned
  t.context.adCampaign3.ads.forEach((ad) => {
    const id = `${t.context.advertiserId1}_${t.context.campaignId3}_${ad.id}`
    t.true(!payload.ads.some(payloadAd => payloadAd.id === id))
  })
})

test.skip('POST `/session/start` 200 success | no ads available still gets a session', async (t) => {
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

test.skip('POST `/session/start` 200 success | existing session', async (t) => {
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

test.skip('POST `/session/start` 200 success | user has opted out of ads', async (t) => {
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

test.skip('POST `/session/start` 500 server error', async (t) => {
  t.context.db.ad.getBatch = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {},
    headers: { authorization: 'Bearer the-best-api-key' }
  })
  t.deepEqual(res.statusCode, 500)
})
