const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
const { MSGS: { NO_SNAPSHOTS } } = require('../../../helpers/constants')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    const nowStub = sinon.stub(Date, 'now').returns(1234)

    // Org with snapshot
    const { id: orgId1 } = await db.organization.create({
      name: 'flossbank',
      host: 'GitHub',
      installationId: 'boopboopbeepboop',
      email: 'honey@etsy.com'
    })
    t.context.orgId1 = orgId1.toString()
    await db.organization.addSnapshot({ orgId: t.context.orgId1, topLevelDeps: 10, totalDeps: 100 })

    nowStub.returns(12345)
    await db.organization.addSnapshot({ orgId: t.context.orgId1, topLevelDeps: 12, totalDeps: 144 })

    // No snapshots
    const { id: orgId2 } = await db.organization.create({
      name: 'vscodium',
      host: 'GitHub',
      installationId: 'boop2',
      email: 'honey@etsy.com'
    })
    t.context.orgId2 = orgId2.toString()
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('GET `/organization/get-oss-usage` 404 unauthorized | no org found', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-oss-usage',
    query: { organizationId: 'aaaaaaaaaaaa' }
  })
  t.deepEqual(res.statusCode, 404)
})

test('GET `/organization/get-oss-usage` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-oss-usage',
    query: { organizationId: t.context.orgId1 }
  })
  t.deepEqual(res.statusCode, 200)
  // Latest snapshot returned
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    details: { topLevelDependencies: 12, totalDependencies: 144, timestamp: 12345 }
  })
})

test('GET `/organization/get-oss-usage` 404 error | no snapshots yet', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-oss-usage',
    query: { organizationId: t.context.orgId2 }
  })
  t.deepEqual(res.statusCode, 404)
  t.deepEqual(JSON.parse(res.payload), { success: false, message: NO_SNAPSHOTS })
})

test('GET `/organization/get-oss-usage` 500 server error', async (t) => {
  t.context.db.organization.get = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/organization/get-oss-usage',
    query: { organizationId: t.context.orgId1 }
  })
  t.deepEqual(res.statusCode, 500)
})
