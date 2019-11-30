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

test.failing('POST `/ad/update` 401 unauthorized', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/update',
    payload: {
      id: 'test-ad-0',
      ad: {
        name: 'ad',
        content: { body: 'abc', title: 'abc', url: 'abc' }
      }
    },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad/update` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/update',
    payload: {
      id: 'test-ad-0',
      ad: {
        name: 'new name',
        content: { body: 'abc', title: 'abc', url: 'abc' }
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })
})

test('POST `/ad/update` 400 bad request', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/update',
    payload: {},
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/ad/update` 500 server error', async (t) => {
  t.context.db.updateAd.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/update',
    payload: {
      id: 'test-ad-0',
      name: 'ad',
      content: {
        title: 'abc',
        body: 'abc',
        url: 'abc'
      }
    },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
