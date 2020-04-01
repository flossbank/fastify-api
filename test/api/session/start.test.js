const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

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

    // active campaign
    t.context.campaignId1 = await db.createAdCampaign(t.context.advertiserId1, {
      ads: [],
      maxSpend: 100,
      cpm: 100,
      name: 'camp pain 1'
    }, [t.context.adId1, t.context.adId2], true)
    await db.approveAdCampaign(t.context.advertiserId1, t.context.campaignId1)
    await db.activateAdCampaign(t.context.advertiserId1, t.context.campaignId1)
    t.context.adCampaign1 = await db.getAdCampaign(t.context.advertiserId1, t.context.campaignId1)

    // inactive campaign
    t.context.campaignId2 = await db.createAdCampaign(t.context.advertiserId1, {
      ads: [],
      maxSpend: 100,
      cpm: 100,
      name: 'camp pain 2'
    }, [t.context.adId1, t.context.adId2], true)
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
  t.context.auth.getAdSessionApiKey.resolves(null)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {}
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/session/start` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {}
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.sessionId, await t.context.auth.createAdSession())

  t.context.adCampaign1.ads.forEach((ad) => {
    const id = `${t.context.advertiserId1}_${t.context.campaignId1}_${ad.id}`
    t.deepEqual(
      payload.ads.find(payloadAd => payloadAd.id === id),
      { id, title: ad.title, body: ad.body, url: ad.url }
    )
  })
})

test('POST `/session/start` 200 success | no ads still gets a session', async (t) => {
  t.context.db.getAdBatch = () => []
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {}
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: [],
    sessionId: await t.context.auth.createAdSession()
  })
})

test('POST `/session/start` 200 success | existing session', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: { sessionId: 'existing-session-id' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.sessionId, 'existing-session-id')
  t.context.adCampaign1.ads.forEach((ad) => {
    const id = `${t.context.advertiserId1}_${t.context.campaignId1}_${ad.id}`
    t.deepEqual(
      payload.ads.find(payloadAd => payloadAd.id === id),
      { id, title: ad.title, body: ad.body, url: ad.url }
    )
  })
})

test('POST `/session/start` 200 success | opted out of ads', async (t) => {
  t.context.auth.getAdSessionApiKey.resolves({ optOutOfAds: true })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {}
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: [],
    sessionId: await t.context.auth.createAdSession()
  })
})

test('POST `/session/start` 500 server error', async (t) => {
  t.context.db.getAdBatch = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/start',
    payload: {}
  })
  t.deepEqual(res.statusCode, 500)
})
