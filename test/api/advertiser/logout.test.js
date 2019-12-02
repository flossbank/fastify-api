const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')
const { advertiserSessionKey } = require('../../../helpers/constants')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/advertiser/logout` 200 success', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/logout',
    headers: {
      cookie: `${advertiserSessionKey}=advertiser-session`
    }
  })
  t.deepEqual(res.statusCode, 200)

  // no cookie is still 200
  res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/logout'
  })
  t.deepEqual(res.statusCode, 200)
})

test('POST `/advertiser/logout` 500 server error', async (t) => {
  t.context.auth.deleteAdvertiserSession.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/logout'
  })
  t.deepEqual(res.statusCode, 500)
})
