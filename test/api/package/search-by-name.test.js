const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db }) => {
    const { id: packageId1 } = await db.package.create({
      name: 'flossbank',
      registry: 'npm',
      language: 'javascript',
      avatarUrl: 'blah.com'
    })
    t.context.packageId = packageId1.toString()

    const { id: packageId2 } = await db.package.create({
      name: 'floss-js-deep-equals',
      registry: 'npm',
      language: 'javascript',
      avatarUrl: 'blah.com'
    })
    t.context.packageId2 = packageId2.toString()
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

test('GET `/package/search` send back packages info for all matches', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/search',
    query: {
      name: 'floss'
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    packages: [{
      id: t.context.packageId,
      name: 'flossbank',
      language: 'javascript',
      registry: 'npm',
      avatarUrl: 'blah.com'
    }, {
      id: t.context.packageId2,
      name: 'floss-js-deep-equals',
      language: 'javascript',
      registry: 'npm',
      avatarUrl: 'blah.com'
    }]
  })
})

test('GET `/package/search` send back packages info for single match', async (t) => {
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
      id: t.context.packageId2,
      name: 'floss-js-deep-equals',
      language: 'javascript',
      registry: 'npm',
      avatarUrl: 'blah.com'
    }]
  })
})

test('GET `/package/search` 200 no packages found', async (t) => {
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
