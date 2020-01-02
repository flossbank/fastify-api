const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = (await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    }))
    t.context.advertiserId1 = advertiserId1.toHexString()

    const campaignId1 = await db.createAdCampaign({
      advertiserId: t.context.advertiserId1,
      ads: [{
        name: 'approved ad',
        body: 'def',
        title: 'DEF',
        url: 'https://def.com'
      }],
      maxSpend: 100,
      cpm: 100,
      name: 'camp pain'
    })
    t.context.campaignId1 = campaignId1.toHexString()
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('GET `/ad-campaign/get` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get',
    query: {
      adCampaignId: t.context.campaignId1
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/ad-campaign/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get',
    query: {
      adCampaignId: t.context.campaignId1
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    adCampaign: {
      id: t.context.campaignId1,
      active: false,
      spend: 0,
      advertiserId: t.context.advertiserId1,
      ads: [{
        name: 'approved ad',
        body: 'def',
        title: 'DEF',
        url: 'https://def.com'
      }],
      maxSpend: 100,
      cpm: 100,
      name: 'camp pain'
    }
  })
})

test('GET `/ad-campaign/get` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get',
    query: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/ad-campaign/get` 500 server error campaign get threw', async (t) => {
  t.context.db.getAdCampaign = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get',
    query: {
      adCampaignId: 'test-ad-campaign-0'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
