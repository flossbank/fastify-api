const test = require('ava')
const { MAINTAINER_SESSION_KEY } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const maintainerId1 = await db.createMaintainer({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper',
      organization: 'elf-world'
    })
    t.context.maintainerId = maintainerId1.toHexString()
    await db.verifyMaintainer('honey@etsy.com')
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.maintainer.getWebSession.resolves({
    maintainerId: t.context.maintainerId
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('GET `/maintainer/resume` 401 unauthorized | no session', async (t) => {
  t.context.auth.maintainer.getWebSession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${MAINTAINER_SESSION_KEY}=maintainer-session`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/resume` 200 | success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${MAINTAINER_SESSION_KEY}=maintainer-session`
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
      cookie: `${MAINTAINER_SESSION_KEY}=maintainer-session`
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
      cookie: `${MAINTAINER_SESSION_KEY}=maintainer-session`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
