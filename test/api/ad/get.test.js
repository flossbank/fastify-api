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

    // active campaign
    const campaignId1 = await db.createAdCampaign({
      advertiserId: t.context.advertiserId1,
      ads: [
        { id: 'tf-1', name: 'Teacher Fund #1', content: { title: 'Teacher Fund', body: 'You donate, we donate.', url: 'teacherfund.com' }, approved: true },
        { id: 'tf-2', name: 'Teacher Fund #2', content: { title: 'Fund The Teachers', body: 'We, you, donate, donate.', url: 'teacherfund.com' }, approved: true }
      ],
      maxSpend: 100,
      cpm: 100,
      name: 'camp pain 1'
    })
    t.context.campaignId1 = campaignId1.toHexString()
    await db.activateAdCampaign(t.context.campaignId1)

    // inactive campaign
    const campaignId2 = await db.createAdCampaign({
      advertiserId: t.context.advertiserId1,
      ads: [
        { name: 'Inbeeb #1', content: { title: 'Inbeeb', body: 'Higher hires.', url: 'inbeeb.com' }, approved: true },
        { name: 'Inbeeb #2', content: { title: 'Inbeeb', body: 'Not in Kansas.', url: 'vscodium.com' }, approved: true }
      ],
      maxSpend: 100,
      cpm: 100,
      name: 'camp pain 2'
    })
    t.context.campaignId2 = campaignId2.toHexString()
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

test('POST `/ad/get` 401 unauthorized', async (t) => {
  t.context.auth.isAdSessionAllowed.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { registry: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad/get` 400 bad request', async (t) => {
  let res

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { registry: 'invalid', packages: ['yttrium-server@latest'] }
  })
})

test('POST `/ad/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { registry: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.sessionId, await t.context.auth.createAdSession())
  t.deepEqual(
    payload.ads.find(ad => ad.id === 'tf-1'),
    { id: 'tf-1', title: 'Teacher Fund', body: 'You donate, we donate.', url: 'teacherfund.com' }
  )
  t.deepEqual(
    payload.ads.find(ad => ad.id === 'tf-2'),
    { id: 'tf-2', title: 'Fund The Teachers', body: 'We, you, donate, donate.', url: 'teacherfund.com' }
  )
})

test('POST `/ad/get` 200 success | no ads no session', async (t) => {
  t.context.db.getAdBatch = () => []
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { registry: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: [],
    sessionId: ''
  })
})

test('POST `/ad/get` 200 success | existing session', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: {
      registry: 'npm',
      packages: ['yttrium-server@latest'],
      sessionId: 'existing-session-id'
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.sessionId, 'existing-session-id')
  t.deepEqual(
    payload.ads.find(ad => ad.id === 'tf-1'),
    { id: 'tf-1', title: 'Teacher Fund', body: 'You donate, we donate.', url: 'teacherfund.com' }
  )
  t.deepEqual(
    payload.ads.find(ad => ad.id === 'tf-2'),
    { id: 'tf-2', title: 'Fund The Teachers', body: 'We, you, donate, donate.', url: 'teacherfund.com' }
  )
})

test('POST `/ad/get` 500 server error', async (t) => {
  t.context.db.getAdBatch = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { registry: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 500)
})
