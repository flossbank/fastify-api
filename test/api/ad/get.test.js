const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/ad/get` 401 unauthorized', async (t) => {
  t.context.auth.isRequestAllowed.resolves(false)
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { packageManager: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/ad/get` 400 bad request', async (t) => {
  let res

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { packageManager: 'invalid', packages: ['yttrium-server@latest'] }
  })
})

test('POST `/ad/get` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { packageManager: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: await t.context.db.getAdBatch(),
    sessionId: await t.context.auth.createAdSession()
  })
})

test('POST `/ad/get` 200 success | existing session', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: {
      packageManager: 'npm',
      packages: ['yttrium-server@latest'],
      sessionId: 'existing-session-id'
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    ads: await t.context.db.getAdBatch(),
    sessionId: 'existing-session-id'
  })
})

test('POST `/ad/get` 500 server error', async (t) => {
  t.context.db.getAdBatch.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/ad/get',
    payload: { packageManager: 'npm', packages: ['yttrium-server@latest'] }
  })
  t.deepEqual(res.statusCode, 500)
})
