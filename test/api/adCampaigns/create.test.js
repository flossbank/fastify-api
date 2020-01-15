const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')
const { AD_NOT_CLEAN_MSG } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId1 = advertiserId1.toHexString()
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
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain 1'
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/create` 200 success', async (t) => {
  const campaignToCreate = {
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: campaignToCreate,
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const campaign = await t.context.db.getAdCampaign(t.context.advertiserId1, id)
  t.deepEqual(campaign.maxSpend, campaignToCreate.maxSpend)
  t.deepEqual(campaign.cpm, campaignToCreate.cpm)
  t.deepEqual(campaign.name, campaignToCreate.name)
})

test('POST `/ad-campaign/create` 200 success with ads', async (t) => {
  const campaignToCreate = {
    ads: [{
      name: 'unapproved ad',
      body: 'abc',
      title: 'ABC',
      url: 'https://abc.com',
      approved: false
    }, {
      name: 'approved ad',
      body: 'def',
      title: 'DEF',
      url: 'https://def.com',
      approved: true
    }],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: campaignToCreate,
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)

  t.deepEqual(payload.success, true)
  const { id } = payload

  const campaign = await t.context.db.getAdCampaign(t.context.advertiserId1, id)
  t.deepEqual(campaign.ads.length, campaignToCreate.ads.length)
  t.deepEqual(campaign.name, campaignToCreate.name)

  // All ads in campaign create should NOT be approved
  campaign.ads.forEach(ad => t.false(ad.approved))
})

test('POST `/ad-campaign/create` 400 bad request | trash ads', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      ads: [{
        name: 'trash ad',
        body: 'a\n\nbc',
        title: 'ABC',
        url: 'https://abc.com'
      }],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: AD_NOT_CLEAN_MSG })
})

test('POST `/ad-campaign/create` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      maxSpend: 1000,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      maxSpend: 1000,
      cpm: 100
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

test('POST `/ad-campaign/create` 500 server error', async (t) => {
  t.context.db.createAdCampaign = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/create',
    payload: {
      ads: [],
      maxSpend: 1000,
      cpm: 100,
      name: 'camp pain'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
