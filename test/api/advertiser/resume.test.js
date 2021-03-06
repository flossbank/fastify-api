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
//         name: 'Honesty',
//         email: 'honey@etsy.com',
//         password: 'beekeeperbookkeeper',
//         organization: 'elf-world'
//       }
//     })
//     t.context.advertiserId = advertiserId1.toHexString()
//     await db.advertiser.verify({ email: 'honey@etsy.com' })

//     const session = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId })
//     t.context.sessionId = session.sessionId
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

// test('GET `/advertiser/resume` 401 unauthorized | no session', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/advertiser/resume',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
//     }
//   })
//   t.deepEqual(res.statusCode, 401)
// })

// test('GET `/advertiser/resume` 200 | success', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/advertiser/resume',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
//     }
//   })
//   t.deepEqual(res.statusCode, 200)
//   const payload = JSON.parse(res.payload)
//   t.deepEqual(payload.success, true)
//   const advertiserRetrieved = await t.context.db.advertiser.get({
//     advertiserId: t.context.advertiserId
//   })
//   t.deepEqual(payload.advertiser, { ...advertiserRetrieved, id: advertiserRetrieved.id.toHexString() })
// })

// test('GET `/advertiser/resume` 400 | no advertiser', async (t) => {
//   t.context.db.advertiser.get = () => undefined
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/advertiser/resume',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
//     }
//   })
//   t.deepEqual(res.statusCode, 400)
// })

// test('GET `/advertiser/resume` 500 | advertiser query error', async (t) => {
//   t.context.db.advertiser.get = () => { throw new Error() }
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/advertiser/resume',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
//     }
//   })
//   t.deepEqual(res.statusCode, 500)
// })
