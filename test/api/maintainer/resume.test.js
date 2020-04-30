const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { MAINTAINER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const maintainerId1 = await db.createMaintainer({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper',
      organization: 'elf-world'
    })
    t.context.maintainerId = maintainerId1.toHexString()
    await db.verifyMaintainer('honey@etsy.com')
    t.context.sessionId = await auth.maintainer.createWebSession({ maintainerId: t.context.maintainerId })
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

test('GET `/maintainer/resume` 401 unauthorized | no session', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/resume` 200 | success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.success, true)
  const maintainerRetrieved = await t.context.db.getMaintainer(t.context.maintainerId)
  t.deepEqual(payload.maintainer, { ...maintainerRetrieved, id: maintainerRetrieved.id.toHexString() })
})

test('GET `/maintainer/resume` 400 | no maintainer', async (t) => {
  t.context.db.getMaintainer = () => undefined
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/maintainer/resume` 500 | maintainer query error', async (t) => {
  t.context.db.getMaintainer = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${MAINTAINER_WEB_SESSION_COOKIE}=${t.context.sessionId}`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
