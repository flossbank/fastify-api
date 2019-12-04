const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')
const { maintainerSessionKey } = require('../../../helpers/constants')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/maintainer/login` 401 unauthorized', async (t) => {
  t.context.db.authenticateMaintainer.resolves({ success: false })
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'email', password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/maintainer/login` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'email', password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(res.headers['set-cookie'], `${maintainerSessionKey}=maintainer-session`)
})

test('POST `/maintainer/login` 400 bad request', async (t) => {
  let res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: {}
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'email' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/maintainer/login` 500 server error', async (t) => {
  t.context.db.authenticateMaintainer.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'email', password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 500)
})
