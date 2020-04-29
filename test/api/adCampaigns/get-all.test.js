const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = (await db.createAdvertiser({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper'
    }))
    t.context.advertiserId1 = advertiserId1.toHexString()

    t.context.campaignId1 = await db.createAdCampaign(t.context.advertiserId1, {
      maxSpend: 100,
      cpm: 100,
      name: 'camp pain'
    })
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.advertiser.getWebSession.resolves({
    advertiserId: t.context.advertiserId1
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('GET `/ad-campaign/get-all` 401 unauthorized | no session', async (t) => {
  t.context.auth.advertiser.getWebSession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get-all',
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/ad-campaign/get-all` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get-all',
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    adCampaigns: [
      {
        id: t.context.campaignId1,
        ads: [],
        maxSpend: 100,
        approved: false,
        cpm: 100,
        name: 'camp pain',
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
    query: { advertiserId: t.context.advertiserId1 },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
