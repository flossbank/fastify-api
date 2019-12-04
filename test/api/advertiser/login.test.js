const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')
const { advertiserSessionKey } = require('../../../helpers/constants')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/advertiser/login` 401 unauthorized', async (t) => {
  t.context.db.authenticateAdvertiser.resolves({ success: false })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'email', password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/login` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'email', password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(res.headers['set-cookie'], `${advertiserSessionKey}=advertiser-session`)
})

test('POST `/advertiser/login` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/advertiser/login` 500 server error', async (t) => {
  t.context.db.authenticateAdvertiser.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/login',
    body: { email: 'email', password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 500)
})
