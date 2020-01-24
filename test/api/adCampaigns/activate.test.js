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

    t.context.adId1 = await db.createAdDraft(t.context.advertiserId1, {
      name: 'Teacher Fund #1',
      title: 'Teacher Fund',
      body: 'You donate, we donate.',
      url: 'teacherfund.com'
    })
    t.context.adId2 = await db.createAdDraft(t.context.advertiserId1, {
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

test('POST `/ad-campaign/activate` 401 unauthorized no session', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 1'
  }, [t.context.adId1], true)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/activate` 200 success', async (t) => {
  const adCampaignId1 = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  }, [t.context.adId2], true)
  await t.context.db.approveAdCampaign(t.context.advertiserId1, adCampaignId1)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId: adCampaignId1 },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const campaign = await t.context.db.getAdCampaign(t.context.advertiserId1, adCampaignId1)
  t.true(campaign.active)
})

test('POST `/ad-campaign/activate` 400 bad request | unapproved campaign', async (t) => {
  const newAdCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [{
      name: 'blah',
      title: 'arg',
      body: 'ugh',
      url: 'ugh.com'
    }],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 3'
  })

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId: newAdCampaignId },
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
  t.context.db.getAdCampaign = () => { throw new Error('poop') }
  const adCampaignId = await t.context.db.createAdCampaign(t.context.advertiserId1, {
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  }, [t.context.adId2], true)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/activate',
    payload: { adCampaignId },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
