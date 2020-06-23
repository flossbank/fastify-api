const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../_helpers/_setup')
const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../helpers/constants')

test.before(async (t) => {
  await before(t)
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.advertiser.getWebSession = () => { throw new Error() }
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('POST `/ad/create` 500 middleware failure', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/create',
    payload: {
      name: 'add 1',
      title: 'halp',
      body: 'dov with',
      url: 'the puzzle'
    },
    headers: {
      cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
