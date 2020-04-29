const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test('c-r stub', t => t.pass())
// test.before(async (t) => {
//   await before(t, () => {})
//   sinon.stub(Date, 'now').returns(1234)
// })

// test.beforeEach(async (t) => {
//   await beforeEach(t)
// })

// test.afterEach(async (t) => {
//   await afterEach(t)
// })

// test.after(async (t) => {
//   await after(t)
//   Date.now.restore()
// })

// test('POST `/user/validate-captcha` 400 bad request', async (t) => {
//   let res = await t.context.app.inject({
//     method: 'POST',
//     url: '/user/validate-captcha',
//     payload: {}
//   })
//   t.deepEqual(res.statusCode, 400)

//   res = await t.context.app.inject({
//     method: 'POST',
//     url: '/user/validate-captcha',
//     payload: { email: 'email' }
//   })
//   t.deepEqual(res.statusCode, 400)

//   res = await t.context.app.inject({
//     method: 'POST',
//     url: '/user/validate-captcha',
//     payload: { email: 'email', token: 'token' }
//   })
//   t.deepEqual(res.statusCode, 400)

//   res = await t.context.app.inject({
//     method: 'POST',
//     url: '/user/validate-captcha',
//     payload: { email: 'email', response: 'response' }
//   })
//   t.deepEqual(res.statusCode, 400)
// })

// test('POST `/user/validate-captcha` 200 success', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/user/validate-captcha',
//     payload: { email: 'PETER@quo.cc', token: 'token', response: 'response' }
//   })
//   t.deepEqual(res.statusCode, 200)
//   t.deepEqual(JSON.parse(res.payload).success, true)
//   t.truthy(!!JSON.parse(res.payload).apiKey)

//   // Just see if a user was created with api key
//   t.truthy(!!(await t.context.db.getUserByEmail('peter@quo.cc')).apiKey)
// })

// test('POST `/user/validate-captcha` 200 success | existing user', async (t) => {
//   const existingUser = { email: 'papi@gmail.co', billingInfo: {} }
//   const { apiKey, insertedId } = await t.context.db.createUser(existingUser)
//   existingUser.id = insertedId
//   existingUser.apiKeysRequested = [{ timestamp: 1234 }]
//   existingUser.apiKey = apiKey

//   // When validating captha another apiKeysRequested will be appended
//   existingUser.apiKeysRequested.push({ timestamp: 1234 })

//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/user/validate-captcha',
//     payload: { email: 'papi@gmail.co', token: 'token', response: 'response' }
//   })
//   t.deepEqual(res.statusCode, 200)
//   t.deepEqual(JSON.parse(res.payload), {
//     success: true,
//     apiKey: existingUser.apiKey
//   })

//   const user = await t.context.db.getUserByEmail('papi@gmail.co')
//   t.deepEqual(user, existingUser) // user wasn't touched except for the apiKeysRequested
// })

// test('POST `/user/validate-captcha` 401 unauthorized', async (t) => {
//   t.context.auth.validateCaptcha.resolves(false)
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/user/validate-captcha',
//     payload: { email: 'peter@quo.cc', token: 'token', response: 'response' }
//   })
//   t.deepEqual(res.statusCode, 401)
// })

// test('POST `/user/validate-captcha` 500 server error', async (t) => {
//   t.context.auth.validateCaptcha.throws()
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/user/validate-captcha',
//     payload: { email: 'peter@quo.cc', token: 'token', response: 'response' }
//   })
//   t.deepEqual(res.statusCode, 500)
// })
