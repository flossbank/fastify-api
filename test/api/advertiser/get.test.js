const test = require('ava')

test('stub', (t) => {
  t.true(true)
})

// const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
// const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

// test.before(async (t) => {
//   await before(t, async ({ db, auth }) => {
//     const advertiserId1 = await db.advertiser.create({
//       advertiser: {
//         firstName: 'Honesty',
//         lastName: 'Empathy',
//         email: 'honey@etsy.com',
//         password: 'beekeeperbookkeeper'
//       }
//     })
//     t.context.advertiserId1 = advertiserId1.toHexString()
//     await db.advertiser.verify({ email: 'honey@etsy.com' })
//     const session = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId1 })
//     t.context.sessionId = session.sessionId

//     const unverifiedAdvertiserId = await db.advertiser.create({
//       advertiser: {
//         firstName: 'Honesty',
//         lastName: 'Empathy',
//         email: 'honey@etsy.com',
//         password: 'beekeeperbookkeeper'
//       }
//     })
//     t.context.unverifiedAdvertiserId = unverifiedAdvertiserId.toHexString()
//     const unverifiedSession = await auth.advertiser.createWebSession({ advertiserId: t.context.unverifiedAdvertiserId })
//     t.context.unverifiedSession = unverifiedSession.sessionId
//   })
// })

// test.beforeEach(async (t) => {
//   await beforeEach(t)
// })

// test.afterEach(async (t) => {
//   await afterEach(t)
// })

// test.after(async (t) => {
//   await after(t)
// })

// test('GET `/advertiser/get` 401 unauthorized', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/advertiser/get',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
//     }
//   })
//   t.deepEqual(res.statusCode, 401)
// })

// test('GET `/advertiser/get` 400 | unverified', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/advertiser/get',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.unverifiedSession}`
//     }
//   })
//   t.deepEqual(res.statusCode, 400)
// })

// test('GET `/advertiser/get` 200 success', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/advertiser/get',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
//     }
//   })
//   t.deepEqual(res.statusCode, 200)
//   t.deepEqual(JSON.parse(res.payload), {
//     success: true,
//     advertiser: {
//       adDrafts: [],
//       id: t.context.advertiserId1,
//       firstName: 'Honesty',
//       lastName: 'Empathy',
//       email: 'honey@etsy.com',
//       billingInfo: {},
//       adCampaigns: [],
//       verified: true,
//       active: true
//     }
//   })
// })

// test('GET `/advertiser/get` 500 server error', async (t) => {
//   t.context.db.advertiser.get = () => { throw new Error() }
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/advertiser/get',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
//     }
//   })
//   t.deepEqual(res.statusCode, 500)
// })
