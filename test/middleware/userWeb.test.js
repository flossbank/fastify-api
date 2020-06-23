const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../_helpers/_setup')

test.before(async (t) => {
  await before(t)
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.user.getWebSession = () => { throw new Error() }
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('GET `/user/get-donation-info` 500 middleware failure', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/user/get-donation-info'
  })
  t.deepEqual(res.statusCode, 500)
})
