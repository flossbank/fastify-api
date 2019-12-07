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
      ads: [],
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

test.failing('GET `/ad-campaign/get-all` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/ad-campaign',
    query: { advertiserId: t.context.advertiserId1 },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/ad-campaign/get-all` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get-all',
    query: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/ad-campaign/get-all` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get-all',
    query: { advertiserId: t.context.advertiserId1 },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    adCampaigns: [
      {
        id: t.context.campaignId1,
        advertiserId: t.context.advertiserId1,
        ads: [],
        maxSpend: 100,
        cpm: 100,
        name: 'camp pain',
        spend: 0,
        active: false
      }
    ]
  })
})

test('GET `/ad-campaign/get-all` 500 server error', async (t) => {
  t.context.db.getAdCampaignsForAdvertiser = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get-all',
    query: { advertiserId: 'advertiser-id-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
