const test = require('ava')
const { maintainerSessionKey } = require('../../../helpers/constants')
const { before, beforeEach, afterEach, after } = require('../../helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const maintainerId1 = await db.createMaintainer({
      name: 'Honesty',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper',
      organization: 'elf-world'
    })
    t.context.maintainerId = maintainerId1.toHexString()
    await db.updateMaintainer(maintainerId1.toHexString(), {
      verified: true
    })
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.getUISession.resolves({
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
  t.context.auth.getUISession.resolves(null)
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${maintainerSessionKey}=maintainer-session`
    }
  })
  t.deepEqual(res.statusCode, 401)
})

test('GET `/maintainer/resume` 200 | success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${maintainerSessionKey}=maintainer-session`
    }
  })
  const maintainerRetrieved = await t.context.db.getMaintainer(t.context.maintainerId)
  const payload = JSON.parse(res.payload)
  t.deepEqual(payload.success, true)
  t.deepEqual(payload.maintainer, { ...maintainerRetrieved, id: maintainerRetrieved.id.toHexString() })
  t.deepEqual(res.statusCode, 200)
})

test('GET `/maintainer/resume` 400 | no maintainer', async (t) => {
  t.context.db.getMaintainer = () => undefined
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/maintainer/resume',
    headers: {
      cookie: `${maintainerSessionKey}=maintainer-session`
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
      cookie: `${maintainerSessionKey}=maintainer-session`
    }
  })
  t.deepEqual(res.statusCode, 500)
})
