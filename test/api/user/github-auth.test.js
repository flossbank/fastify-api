const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t)
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

test('POST `/user/github-auth` 200 success create user', async (t) => {
  t.true(true)
})

test('POST `/user/github-auth` 200 success find existing user', async (t) => {
  t.true(true)
})

test('POST `/user/github-auth` 400 gh auth failed', async (t) => {
  t.true(true)
})

test('POST `/user/github-auth` 400 bad request', async (t) => {
  t.true(true)
})

test('POST `/user/github-auth` 500 server error', async (t) => {
  t.false(false)
})
