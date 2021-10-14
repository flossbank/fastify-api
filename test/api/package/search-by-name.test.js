const test = require('ava')
const sinon = require('sinon')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    t.context.pkg1 = {
      name: 'flossbank',
      registry: 'npm',
      language: 'javascript',
      avatarUrl: 'blah.com'
    }
    t.context.pkg2 = {
      name: 'floss-js-deep-equals',
      registry: 'npm',
      language: 'javascript',
      avatarUrl: 'blah.com'
    }

    const { id: packageId1 } = await db.package.create(t.context.pkg1)
    t.context.packageId = packageId1.toString()

    const { id: packageId2 } = await db.package.create(t.context.pkg2)
    t.context.packageId2 = packageId2.toString()
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)

  t.context.db.package.searchByName = sinon.stub().resolves([t.context.pkg1, t.context.pkg2])
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('GET `/package/search` send back packages info for all matches', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/search',
    query: {
      name: 'js'
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: [{
      name: 'flossbank',
      language: 'javascript',
      registry: 'npm',
      avatarUrl: 'blah.com'
    }, {
      name: 'floss-js-deep-equals',
      language: 'javascript',
      registry: 'npm',
      avatarUrl: 'blah.com'
    }]
  })
})

test('GET `/package/search` send back packages info for single match', async (t) => {
  t.context.db.package.searchByName = sinon.stub().resolves([t.context.pkg2])
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/search',
    query: {
      name: 'floss-js'
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: [{
      name: 'floss-js-deep-equals',
      language: 'javascript',
      registry: 'npm',
      avatarUrl: 'blah.com'
    }]
  })
})

test('GET `/package/search` 200 no packages found', async (t) => {
  t.context.db.package.searchByName = sinon.stub().resolves([])
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/search',
    query: {
      name: 'nonexistent'
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: []
  })
})

test('GET `/package/search` 400 bad input', async (t) => {
  let res = await t.context.app.inject({
    method: 'GET',
    url: '/package/search',
    query: {
      badKey: 'nonexistent'
    }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'GET',
    url: '/package/search',
    query: {
      name: '*' // non alphanumeric (+ hyphens) names are rejected
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('GET `/package/search` 500 error', async (t) => {
  t.context.db.package.searchByName = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/search',
    query: {
      name: 'floss'
    }
  })
  t.deepEqual(res.statusCode, 500)
})
