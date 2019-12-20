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

    t.context.adId1 = {
      name: 'unapproved ad',
      content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
      approved: false
    }

    t.context.adId2 = {
      name: 'approved ad',
      content: { body: 'def', title: 'DEF', url: 'https://def.com' },
      approved: true
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

test('POST `/ad-campaign/activate` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [t.context.adId2],
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

test.failing('POST `/ad-campaign/activate` 200 success', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [t.context.adId2],
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
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const campaign = await t.context.db.getAdCampaign(adCampaignId)
  t.true(campaign.active)
})

test('POST `/ad-campaign/activate` 400 bad request | invalid ads', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [t.context.adId2, t.context.adId1],
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
