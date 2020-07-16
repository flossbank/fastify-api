const test = require('ava')

test('stub', (t) => {
  t.true(true)
})

// const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')
// const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

// test.before(async (t) => {
//   await before(t)
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

// test('POST `/advertiser/logout` 200 success', async (t) => {
//   let res = await t.context.app.inject({
//     method: 'POST',
//     url: '/advertiser/logout',
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=advertiser-session`
//     }
//   })
//   t.deepEqual(res.statusCode, 200)

//   // no cookie is still 200
//   res = await t.context.app.inject({
//     method: 'POST',
//     url: '/advertiser/logout'
//   })
//   t.deepEqual(res.statusCode, 200)
// })

// test('POST `/advertiser/logout` 500 server error', async (t) => {
//   t.context.auth.advertiser.deleteWebSession = () => { throw new Error() }
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/advertiser/logout'
//   })
//   t.deepEqual(res.statusCode, 500)
// })
