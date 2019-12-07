const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.failing('GET `/ad-campaign/get` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad-campaign/get',
    query: {
      adCampaignId: 'test-ad-campaign-0'
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
      adCampaignId: 'test-ad-campaign-0'
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    adCampaign: await t.context.db.getAdCampaign()
  })
})

test('GET `/ad-campaign/get` 500 server error campaign get threw', async (t) => {
  t.context.db.getAdCampaign.throws()
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
