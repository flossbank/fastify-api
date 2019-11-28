const test = require('ava')
const sinon = require('sinon')
const ApiKeyCache = require('../../auth/cache')

test.before(() => {
  sinon.stub(Date, 'now').returns(1234)
})

test.after(() => {
  Date.now.restore()
})

test('construction', (t) => {
  const akc = new ApiKeyCache()
  t.false(akc.expires)
  t.deepEqual(akc.set.size, 0)
})

test('beginExpiring', (t) => {
  const akc = new ApiKeyCache()
  akc.beginExpiring()
  t.deepEqual(akc.expires, Date.now() + (10 * 60 * 1000))
})

test('checkExpiration', (t) => {
  const akc = new ApiKeyCache()
  t.false(akc.checkExpiration())
  akc.expires = 1233
  t.true(akc.checkExpiration())
  akc.expires = 1235
  t.false(akc.checkExpiration())
})

test('add', (t) => {
  const akc = new ApiKeyCache()
  sinon.stub(akc, 'checkExpiration')
  sinon.stub(akc, 'beginExpiring')

  akc.add('abc')
  t.true(akc.checkExpiration.calledOnce)
  t.true(akc.set.has('abc'))
  t.true(akc.beginExpiring.calledOnce)

  akc.checkExpiration.resetHistory()
  akc.beginExpiring.resetHistory()

  akc.expires = 1
  akc.add('def')
  t.true(akc.checkExpiration.calledOnce)
  t.true(akc.set.has('def'))
  t.false(akc.beginExpiring.called)
})

test('remove', (t) => {
  const akc = new ApiKeyCache()
  sinon.stub(akc, 'checkExpiration')

  akc.remove()
  t.true(akc.checkExpiration.calledOnce)

  akc.add('abc')
  t.true(akc.has('abc'))
  akc.remove('abc')
  t.false(akc.has('abc'))
})

test('has', (t) => {
  const akc = new ApiKeyCache()
  sinon.stub(akc, 'checkExpiration')

  t.false(akc.has('abc'))
  t.true(akc.checkExpiration.calledOnce)

  akc.add('abc')
  t.true(akc.has('abc'))
})
