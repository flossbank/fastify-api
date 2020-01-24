const test = require('ava')
const App = require('../../app')

test('csrf | not on gets', async (t) => {
  const app = await App({ logger: false, csrf: true })
  const res = await app.inject({
    method: 'GET',
    url: '/health'
  })
  t.is(res.statusCode, 200)
})

test('csrf | on posts', async (t) => {
  const app = await App({ logger: false, csrf: true })
  let res = await app.inject({
    method: 'POST',
    url: '/health'
  })
  t.is(res.statusCode, 403)

  res = await app.inject({
    method: 'POST',
    url: '/health',
    headers: {
      'x-requested-with': 'XmlHttpRequest'
    }
  })
  t.is(res.statusCode, 200)
})

test('csrf | disabled', async (t) => {
  const app = await App({ logger: false, csrf: false })
  const res = await app.inject({
    method: 'POST',
    url: '/health'
  })
  t.is(res.statusCode, 200)
})
