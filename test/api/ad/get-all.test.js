const test = require('ava')
const App = require('../../../app')
const mocks = require('../../helpers/_mocks')

test.beforeEach(async (t) => {
  t.context.auth = new mocks.Auth()
  t.context.db = new mocks.Db()
  t.context.app = await App(t.context.db, t.context.auth, false)
})

test.afterEach((t) => {
  t.context.app.close()
})

test.failing('GET `/ad/get-all` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/get-all',
    query: { advertiserId: 'advertiser-id' },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/ad/get-all` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/get-all',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/ad/get-all` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/get-all',
    query: { advertiserId: 'advertiser-id-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: await t.context.db.getAdsByAdvertiser()
  })
})

test('GET `/ad/get-all` 500 server error', async (t) => {
  t.context.db.getAdsByAdvertiser.throws()
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/ad/get-all',
    query: { advertiserId: 'advertiser-id-0' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
