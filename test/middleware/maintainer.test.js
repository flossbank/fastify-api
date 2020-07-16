const test = require('ava')

test('stub', (t) => {
  t.true(true)
})

// const { before, beforeEach, afterEach, after } = require('../_helpers/_setup')

// test.before(async (t) => {
//   await before(t)
// })

// test.beforeEach(async (t) => {
//   await beforeEach(t)
//   t.context.auth.maintainer.getWebSession = () => { throw new Error() }
// })

// test.afterEach(async (t) => {
//   await afterEach(t)
// })

// test.after.always(async (t) => {
//   await after(t)
// })

// test('GET `/maintainer/get` 500 middleware failure', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'GET',
//     url: '/maintainer/get'
//   })
//   t.deepEqual(res.statusCode, 500)
// })
