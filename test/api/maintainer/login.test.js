const test = require('ava')
const { MAINTAINER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    await db.maintainer.create({
      maintainer: {
        firstName: 'Honesty',
        lastName: 'Honor',
        email: 'honey@etsy.com',
        password: 'beekeeperbookkeeper'
      }
    })
    await db.maintainer.verify({ email: 'honey@etsy.com' })
    await db.maintainer.create({
      maintainer: {
        firstName: 'Faith',
        lastName: 'Ogler',
        email: 'fogler@folgers.coffee',
        password: 'coffeesnobdoorknob'
      }
    })
  })
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

test('POST `/maintainer/login` 401 unauthorized | no account', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'petey@birdz.com', password: 'whatever' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/maintainer/login` 401 unauthorized | wrong pwd', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'honey@etsy.com', password: 'wrongpassword' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/maintainer/login` 401 unauthorized | unverified', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'fogler@folgers.coffee', password: 'coffeesnobdoorknob' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/maintainer/login` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'honey@etsy.com', password: 'beekeeperbookkeeper' }
  })
  t.deepEqual(res.statusCode, 200)
  t.true(res.headers['set-cookie'].includes(MAINTAINER_WEB_SESSION_COOKIE))
})

test('POST `/maintainer/login` 200 success | email case does not matter', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'HOney@ETSY.coM', password: 'beekeeperbookkeeper' }
  })
  t.deepEqual(res.statusCode, 200)
  t.true(res.headers['set-cookie'].includes(MAINTAINER_WEB_SESSION_COOKIE))
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
  t.context.db.maintainer.authenticate = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/maintainer/login',
    body: { email: 'email@asdf.com', password: 'pwd' }
  })
  t.deepEqual(res.statusCode, 500)
})
