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

    const advertiserId2 = await db.createAdvertiser({
      name: 'Faith Ogler',
      email: 'fogler@folgers.coffee',
      password: 'beekeeperbookkeeper'
    })
    t.context.advertiserId2 = advertiserId2.toHexString()

    t.context.adId1 = {
      name: 'ad #1',
      content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
      approved: false
    }

    t.context.adId2 = {
      name: 'ad #2',
      content: { body: 'def', title: 'DEF', url: 'https://def.com' },
      approved: false
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

test('POST `/ad-campaign/update` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 1'
  })).toHexString()

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        advertiserId: t.context.advertiserId1,
        ads: [t.context.adId1],
        maxSpend: 1000,
        cpm: 100,
        name: 'camp pain 1'
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad-campaign/update` 200 success', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 2'
  })).toHexString()

  const newName = 'camp pain 3'
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        advertiserId: t.context.advertiserId1,
        ads: [t.context.adId1],
        maxSpend: 1000,
        cpm: 100,
        name: newName
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
  const updatedAdCampaign = await t.context.db.getAdCampaign(adCampaignId)
  t.deepEqual(updatedAdCampaign.ads, [t.context.adId1])
  t.equal(updatedAdCampaign.name, newName)
  t.equal(updatedAdCampaign.active, false)
})

test('POST `/ad-campaign/update` 400 bad request | invalid ads', async (t) => {
  const adCampaignId = (await t.context.db.createAdCampaign({
    advertiserId: t.context.advertiserId1,
    ads: [],
    maxSpend: 1000,
    cpm: 100,
    name: 'camp pain 3'
  })).toHexString()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId,
      adCampaign: {
        advertiserId: t.context.advertiserId1,
        ads: [t.context.adId1],
        maxSpend: 1000,
        cpm: 100,
        name: 'camp pain 3'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/update` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: { adCampaignId: 'test-ad-campaign-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: { adCampaign: {} },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad-campaign/update` 500 server error', async (t) => {
  t.context.db.updateAdCampaign = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad-campaign/update',
    payload: {
      adCampaignId: 'test-ad-campaign-0',
      adCampaign: {
        advertiserId: 'test-advertiser-0',
        ads: [],
        maxSpend: 1000,
        cpm: 100,
        name: 'camp pain'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
