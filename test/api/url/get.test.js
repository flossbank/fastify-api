const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, () => {})
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('GET /u/asdf | 301', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/u/asdf'
  })
  t.is(res.statusCode, 301)
  t.is(res.headers.location, 'http://localhost.com')
})

test('GET /u/fdsa | 404', async (t) => {
  t.context.url.getUrl.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/u/fdsa'
  })
  t.is(res.statusCode, 404)
})

test('GET /u/asdf | 500', async (t) => {
  t.context.url.getUrl = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/u/asdf'
  })
  t.is(res.statusCode, 500)
})
