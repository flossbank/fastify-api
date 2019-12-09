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

    const adId1 = await db.createAd({
      name: 'approved inactive ad',
      content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
      advertiserId: t.context.advertiserId1,
      active: false,
      approved: false
    })
    t.context.adId1 = adId1.toHexString()

    const adId2 = await db.createAd({
      name: 'unapproved inactive ad',
      content: { body: 'def', title: 'DEF', url: 'https://def.com' },
      advertiserId: t.context.advertiserId1,
      active: false,
      approved: false
    })
    t.context.adId2 = adId2.toHexString()

    const adId3 = await db.createAd({
      name: 'approved active ad',
      content: { body: 'hij', title: 'HIJ', url: 'https://hij.com' },
      advertiserId: t.context.advertiserId1,
      active: true,
      approved: true
    })
    t.context.adId3 = adId3.toHexString()
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
    payload: { packageManager: 'npm', packages: ['yttrium-server@latest'] }
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
    payload: { packageManager: 'invalid', packages: ['yttrium-server@latest'] }
  })
})

test('POST `/ad/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { packageManager: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: [{ id: t.context.adId3, title: 'HIJ', body: 'hij', url: 'https://hij.com' }],
    sessionId: await t.context.auth.createAdSession()
  })
})

test('POST `/ad/get` 200 success | no ads no session', async (t) => {
  t.context.db.getAdBatch = () => []
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { packageManager: 'npm', packages: ['yttrium-server@latest'] }
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
      packageManager: 'npm',
      packages: ['yttrium-server@latest'],
      sessionId: 'existing-session-id'
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: [{ id: t.context.adId3, title: 'HIJ', body: 'hij', url: 'https://hij.com' }],
    sessionId: 'existing-session-id'
  })
})

test('POST `/ad/get` 500 server error', async (t) => {
  t.context.db.getAdBatch = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { packageManager: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 500)
})
