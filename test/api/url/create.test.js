const test = require('ava')

test('stub', (t) => {
  t.true(true)
})

// const sinon = require('sinon')
// const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')
// const { base32 } = require('rfc4648')
// const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

// test.before(async (t) => {
//   await before(t, async ({ auth }) => {
//     const session = await auth.advertiser.createWebSession({ advertiserId: 'advertiser-id' })
//     t.context.sessionId = session.sessionId
//   })
//   sinon.stub(base32, 'stringify').returns('DEADBEEF')
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

// test('POST /url/create | 401', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/url/create',
//     body: { url: 'http://localhost.com' },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
//     }
//   })
//   t.is(res.statusCode, 401)
// })

// test('POST /url/create | 200', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/url/create',
//     body: { url: 'http://localhost.com' },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
//     }
//   })
//   t.is(res.statusCode, 200)
//   t.deepEqual(JSON.parse(res.payload), {
//     success: true,
//     url: 'https://api.flossbank.io/u/DEADBEEF'
//   })
// })

// test('POST /url/create | 400', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/url/create',
//     body: {},
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
//     }
//   })
//   t.deepEqual(res.statusCode, 400)
// })

// test('POST /url/create | 500', async (t) => {
//   t.context.url.createUrl = () => { throw new Error() }
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/url/create',
//     body: { url: 'http://localhost.com' },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
//     }
//   })
//   t.deepEqual(res.statusCode, 500)
// })
