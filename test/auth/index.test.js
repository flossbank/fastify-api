const crypto = require('crypto')
const test = require('ava')
const sinon = require('sinon')
const got = require('got')
const auth = require('../../auth')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(Date, 'now').returns(1234)
  sinon.stub(crypto, 'randomBytes').returns(Buffer.from('ff', 'hex'))
})

test.beforeEach(() => {
  sinon.stub(got, 'post').resolves({ body: JSON.stringify({ success: true }) })
  sinon.stub(auth.docs, 'get').returns({
    promise: sinon.stub()
  })
  sinon.stub(auth.docs, 'put').returns({
    promise: sinon.stub()
  })
  sinon.stub(auth.docs, 'update').returns({
    promise: sinon.stub()
  })
  sinon.stub(auth.docs, 'delete').returns({
    promise: sinon.stub()
  })
  sinon.stub(auth.ses, 'sendEmail').returns({
    promise: sinon.stub()
  })
  sinon.stub(auth.apiKeyCache, 'has')
  sinon.stub(auth.apiKeyCache, 'add')
  sinon.stub(auth.apiKeyCache, 'remove')
})

test.afterEach(() => {
  console.error.reset()
  got.post.restore()
  auth.docs.get.restore()
  auth.docs.put.restore()
  auth.docs.update.restore()
  auth.docs.delete.restore()
  auth.ses.sendEmail.restore()
  auth.apiKeyCache.has.restore()
  auth.apiKeyCache.add.restore()
  auth.apiKeyCache.remove.restore()
})

test.after(() => {
  console.error.restore()
  Date.now.restore()
  crypto.randomBytes.restore()
})

test('sendUserToken | missing params', async (t) => {
  await t.throwsAsync(auth.sendUserToken())
})

test('sendUserToken | success', async (t) => {
  await auth.sendUserToken('pam@dundermifflin.com', auth.authKinds.USER)
  t.true(auth.docs.put.calledWith({
    TableName: 'flossbank_user_auth',
    Item: { email: 'pam@dundermifflin.com', token: 'ff', kind: auth.authKinds.USER, expires: Date.now() + (15 * 60 * 1000) }
  }))
  t.deepEqual(
    auth.ses.sendEmail.lastCall.args[0].Destination.ToAddresses,
    ['pam@dundermifflin.com']
  )
})

test('validateUserToken | missings params', async (t) => {
  t.false(await auth.validateUserToken())
  t.false(await auth.validateUserToken('email'))
  t.false(await auth.validateUserToken(undefined, 'token'))
  t.false(await auth.validateUserToken('email', 'token', undefined))
})

test('validateUserToken | no user', async (t) => {
  auth.docs.get().promise.resolves({})
  t.false(await auth.validateUserToken('email', 'token', auth.authKinds.USER))
  t.true(console.error.calledOnce)
})

test('invalid kind', async (t) => {
  auth.docs.get().promise.resolves({ Item: { email: 'email', token: 'token', kind: 'notUser' } })
  t.false(await auth.validateUserToken('email', 'token', auth.authKinds.USER))
})

test('validateUserToken | no hex token or no expires', async (t) => {
  auth.docs.get().promise.resolves({ Item: { email: 'email', kind: auth.authKinds.USER, token: '' } })
  t.false(await auth.validateUserToken('email', 'token', auth.authKinds.USER))
  auth.docs.get().promise.resolves({ Item: { email: 'email', kind: auth.authKinds.USER, token: 'aa' } })
  t.false(await auth.validateUserToken('email', 'token', auth.authKinds.USER))
  t.true(console.error.calledTwice)
  t.true(auth.docs.delete.calledTwice)
})

test('validateUserToken | expired', async (t) => {
  auth.docs.get().promise.resolves({ Item: { email: 'email', token: 't', kind: auth.authKinds.USER, expires: 1 } })
  t.false(await auth.validateUserToken('email', 'token', auth.authKinds.USER))
  t.true(console.error.calledOnce)
  t.true(auth.docs.delete.calledOnce)
})

test('validateUserToken | not equal', async (t) => {
  auth.docs.get().promise.resolves({ Item: { email: 'email', kind: auth.authKinds.USER, token: '00', expires: 2345 } })
  t.false(await auth.validateUserToken('email', '01', auth.authKinds.USER))
  t.true(console.error.calledOnce)
  t.true(auth.docs.delete.calledOnce)
})

test('validateUserToken | success', async (t) => {
  auth.docs.get().promise.resolves({ Item: { email: 'email', kind: auth.authKinds.USER, token: '01', expires: 2345 } })
  t.true(await auth.validateUserToken('email', '01', auth.authKinds.USER))
  t.true(auth.docs.update.calledOnce)
})

test('validateUserToken | already valid', async (t) => {
  auth.docs.get().promise.resolves({ Item: { email: 'email', kind: auth.authKinds.USER, token: '01', expires: 2345, valid: true } })
  t.true(await auth.validateUserToken('email', '01', auth.authKinds.USER))
  t.true(auth.docs.update.notCalled)
})

test('validateCaptcha | calls validate user token', async (t) => {
  sinon.stub(auth, 'validateUserToken')
  await auth.validateCaptcha('email', 'token', 'response')
  t.true(auth.validateUserToken.calledWith('email', 'token', auth.authKinds.USER))
  auth.validateUserToken.restore()
})

test('validateCaptcha | failure', async (t) => {
  got.post.returns({ body: JSON.stringify({ success: false }) })
  sinon.stub(auth, 'validateUserToken').returns(true)
  await auth.validateCaptcha('email', 'token', 'response')
  t.true(got.post.calledWith('https://www.google.com/recaptcha/api/siteverify'))
  t.true(auth.docs.delete.calledOnce)
  auth.validateUserToken.restore()
})

test('validateCaptcha | success', async (t) => {
  sinon.stub(auth, 'validateUserToken').returns(true)
  await auth.validateCaptcha('email', 'token', 'response')
  t.true(got.post.calledWith('https://www.google.com/recaptcha/api/siteverify'))
  t.true(auth.docs.put.calledWith({
    TableName: 'flossbank_api_keys',
    Item: { key: 'ff', email: 'email', timestamp: 1234, lastAccess: 1234 }
  }))
  t.true(auth.docs.delete.calledOnce)
  auth.validateUserToken.restore()
})

test('deleteUserToken | missing params', async (t) => {
  await auth.deleteUserToken()
  t.true(auth.docs.delete.notCalled)
})

test('deleteUserToken | success', async (t) => {
  await auth.deleteUserToken('email')
  t.true(auth.docs.delete.calledWith({
    TableName: 'flossbank_user_auth',
    Key: { email: 'email' }
  }))
})

test('validateApiKey | missing params', async (t) => {
  t.false(await auth.validateApiKey())
})

test('validateApiKey | get failure', async (t) => {
  auth.docs.get().promise.rejects()
  t.false(await auth.validateApiKey('ff'))
})

test('validateApiKey | falsy item', async (t) => {
  auth.docs.get().promise.resolves({ Item: null })
  t.false(await auth.validateApiKey('ff'))
  t.true(auth.apiKeyCache.remove.calledWith('ff'))
})

test('validateApiKey | success', async (t) => {
  auth.docs.get().promise.resolves({ Item: {} })
  t.true(await auth.validateApiKey('ff'))
  t.true(auth.apiKeyCache.add.calledWith('ff'))
})

test('isRequestAllowed | missing headers', async (t) => {
  t.false(await auth.isRequestAllowed({}))
  t.false(await auth.isRequestAllowed({ headers: {} }))
})

test('isRequestAllowed | checks cache', async (t) => {
  auth.apiKeyCache.has.returns(true)
  t.true(await auth.isRequestAllowed({ headers: { authorization: 'bearer abc' } }))
  t.true(auth.apiKeyCache.has.calledOnce)
})

test('isRequestAllowed | checks db', async (t) => {
  sinon.stub(auth, 'validateApiKey').returns(true)
  auth.apiKeyCache.has.returns(false)
  t.true(await auth.isRequestAllowed({ headers: { authorization: 'bearer abc' } }))
  t.true(auth.apiKeyCache.has.calledOnce)
  t.true(auth.validateApiKey.calledOnce)
  auth.validateApiKey.restore()
})

test('createAdSession | creates and persists session', async (t) => {
  const sessionId = await auth.createAdSession({
    body: {
      packages: ['abc'],
      packageManager: 'npm'
    },
    headers: {
      authorization: 'bearer xyz'
    }
  })
  t.true(auth.docs.put.calledWith({
    TableName: 'flossbank_ad_session',
    Item: {
      sessionId: 'ff',
      apiKey: 'xyz',
      packageManager: 'npm',
      packages: ['abc'],
      created: 1234
    }
  }))
  t.deepEqual(sessionId, 'ff')
})

test('createMaintainerSession | creates and persists session', async (t) => {
  const sessionId = await auth.createMaintainerSession('pete@dov.com')
  const weekexpiration = (7 * 24 * 60 * 1000)
  t.true(auth.docs.put.calledWith({
    TableName: 'flossbank_maintainer_session',
    Item: { sessionId: 'ff', expires: 1234 + weekexpiration, email: 'pete@dov.com' }
  }))
  t.deepEqual(sessionId, 'ff')
})

test('deleteMaintainerSession | deletes session token', async (t) => {
  const sessionId = await auth.createMaintainerSession('pete@dov.com')
  await auth.deleteMaintainerSession(sessionId)
  t.true(auth.docs.delete.calledWith({
    TableName: 'flossbank_maintainer_session',
    Key: { sessionId }
  }))
})

test('createAdvertiserSession | creates and persists session', async (t) => {
  const sessionId = await auth.createAdvertiserSession('pete@dov.com')
  const weekexpiration = (7 * 24 * 60 * 1000)
  t.true(auth.docs.put.calledWith({
    TableName: 'flossbank_advertiser_session',
    Item: { sessionId: 'ff', expires: 1234 + weekexpiration, email: 'pete@dov.com' }
  }))
  t.deepEqual(sessionId, 'ff')
})

test('deleteAdvertiserSession | deletes session token', async (t) => {
  const sessionId = await auth.createAdvertiserSession('pete@dov.com')
  await auth.deleteAdvertiserSession(sessionId)
  t.true(auth.docs.delete.calledWith({
    TableName: 'flossbank_advertiser_session',
    Key: { sessionId }
  }))
})
