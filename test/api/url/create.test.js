const test = require('ava')
const sinon = require('sinon')
const { base32 } = require('rfc4648')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t)
  sinon.stub(base32, 'stringify').returns('DEADBEEF')
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.advertiser.getWebSession = () => ({
    advertiserId: 'advertiser-id'
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('POST /url/create | 401', async (t) => {
  t.context.auth.advertiser.getWebSession = () => null
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/url/create',
    body: { url: 'http://localhost.com' }
  })
  t.is(res.statusCode, 401)
})

test('POST /url/create | 200', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/url/create',
    body: { url: 'http://localhost.com' }
  })
  t.is(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    url: 'https://api.flossbank.io/u/DEADBEEF'
  })
})

test('POST /url/create | 400', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/url/create',
    body: {}
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST /url/create | 500', async (t) => {
  t.context.url.createUrl = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/url/create',
    body: { url: 'http://localhost.com' }
  })
  t.deepEqual(res.statusCode, 500)
})
