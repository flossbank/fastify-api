const test = require('ava')
const { beforeEach, afterEach } = require('../../helpers/_setup')
const { MAX_ADS_PER_PERIOD } = require('../../../helpers/constants')

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test('POST `/session/complete` 401 unauthorized', async (t) => {
  t.context.auth.completeAdSession.resolves({})
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/complete',
    payload: { seen: [], sessionId: 'session-id' },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/session/complete` 400 bad request', async (t) => {
  let res
  res = await t.context.app.inject({
    method: 'POST',
    url: '/session/complete',
    payload: { sessionId: 'session-id' },
    headers: { authorization: 'valid-api-key' }
  })
  t.deepEqual(res.statusCode, 400)

  res = await t.context.app.inject({
    method: 'POST',
    url: '/session/complete',
    payload: { seen: [] },
    headers: { authorization: 'valid-api-key' }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/session/complete` 200 success | extra long seen', async (t) => {
  t.context.auth.completeAdSession.resolves({
    resetTime: 0,
    email: 'pjs@sjp.com',
    key: 'abc',
    totalAdsSeen: 2,
    adsSeenThisPeriod: MAX_ADS_PER_PERIOD - 4,
    timestamp: 1571253769601
  })
  const seen = new Array(6).fill(0).map(_ => 'test-ad-0')
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/complete',
    payload: { seen: seen, sessionId: 'session-id' },
    headers: { authorization: 'valid-api-key' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(t.context.sqs.sendMessage.lastCall.args[0].seen.length, 4)
})

test('POST `/session/complete` 200 success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/complete',
    payload: { seen: [], sessionId: 'session-id' },
    headers: { authorization: 'valid-api-key' }
  })
  t.deepEqual(res.statusCode, 200)
})

test('POST `/session/complete` 500 server error', async (t) => {
  t.context.sqs.sendMessage.throws()
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/session/complete',
    payload: { seen: [], sessionId: 'session-id' },
    headers: { authorization: 'valid-api-key' }
  })
  t.deepEqual(res.statusCode, 500)
})
