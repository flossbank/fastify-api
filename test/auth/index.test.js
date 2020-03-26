const crypto = require('crypto')
const test = require('ava')
const sinon = require('sinon')
const { Auth } = require('../../auth')
const { advertiserSessionKey, maintainerSessionKey } = require('../../helpers/constants')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(Date, 'now').returns(1234)
  sinon.stub(crypto, 'randomBytes').returns(Buffer.from('ff', 'hex'))
})

test.beforeEach((t) => {
  t.context.auth = new Auth()
  t.context.auth.docs = {
    get: sinon.stub().returns({ promise: sinon.stub() }),
    put: sinon.stub().returns({ promise: sinon.stub() }),
    update: sinon.stub().returns({ promise: sinon.stub() }),
    delete: sinon.stub().returns({ promise: sinon.stub() }),
    query: sinon.stub().returns({ promise: sinon.stub() })
  }
  t.context.auth.ses = {
    sendEmail: sinon.stub().returns({ promise: sinon.stub() })
  }
  t.context.auth.post = sinon.stub().resolves({ body: JSON.stringify({ success: true }) })
  t.context.auth.recaptchaSecret = 'abc'
})

test.after(() => {
  console.error.restore()
  Date.now.restore()
  crypto.randomBytes.restore()
})

test('hasUserAuthCheckedInPastOneMinute | yes', async (t) => {
  t.context.auth.checkCache.set('email', 1233)
  t.true(await t.context.auth.hasUserAuthCheckedInPastOneMinute('email'))
})

test('hasUserAuthCheckedInPastOneMinute | no', async (t) => {
  t.false(await t.context.auth.hasUserAuthCheckedInPastOneMinute('email'))
})

test('recordUserAuthCheck | sets in cache', async (t) => {
  await t.context.auth.recordUserAuthCheck('email')
  t.is(t.context.auth.checkCache.get('email'), 1234)
})

test('checkApiKeyForUser | invalid params', async (t) => {
  t.false(await t.context.auth.checkApiKeyForUser())
  t.false(await t.context.auth.checkApiKeyForUser('email'))
  t.false(await t.context.auth.checkApiKeyForUser(undefined, 'apiKey'))
})

test('checkApiKeyForUser | no record', async (t) => {
  t.context.auth.docs.get().promise.resolves(null)
  t.false(await t.context.auth.checkApiKeyForUser('bar', 'valid-api-key'))
})

test('checkApiKeyForUser | key/email mismatch', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'foo' } })
  t.false(await t.context.auth.checkApiKeyForUser('bar', 'valid-api-key'))
})

test('checkApiKeyForUser | dynamo throws', async (t) => {
  t.context.auth.docs.get().promise.rejects()
  t.false(await t.context.auth.checkApiKeyForUser('bar', 'valid-api-key'))
})

test('checkApiKeyForUser | success', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'bar' } })
  t.true(await t.context.auth.checkApiKeyForUser('bar', 'valid-api-key'))
})

test('getAuthToken | no token', (t) => {
  t.false(t.context.auth.getAuthToken({ headers: {} }))
})

test('getAuthToken | success', (t) => {
  t.is(
    t.context.auth.getAuthToken({ headers: { authorization: 'bearer hotaf' } }),
    'hotaf'
  )
})

test('getSessionToken | advertiser', (t) => {
  const token = t.context.auth.getSessionToken({
    cookies: {
      [advertiserSessionKey]: 'adv_sess'
    }
  }, t.context.auth.authKinds.ADVERTISER)
  t.is(token, 'adv_sess')
})

test('getSessionToken | maintainer', (t) => {
  const token = t.context.auth.getSessionToken({
    cookies: {
      [maintainerSessionKey]: 'mnt_sess'
    }
  }, t.context.auth.authKinds.MAINTAINER)
  t.is(token, 'mnt_sess')
})

test('getSessionToken | invalid kind', (t) => {
  const token = t.context.auth.getSessionToken({
    cookies: {
      [maintainerSessionKey]: 'mnt_sess'
    }
  }, t.context.auth.authKinds.USER)
  t.is(token, false)
})

test('getSessionToken | no token in cookie', (t) => {
  const token = t.context.auth.getSessionToken({
    cookies: {}
  }, t.context.auth.authKinds.MAINTAINER)
  t.is(token, false)
})

test('isAdSessionAllowed | missing headers', async (t) => {
  t.false(await t.context.auth.isAdSessionAllowed({}))
  t.false(await t.context.auth.isAdSessionAllowed({ headers: {} }))
})

test('isAdSessionAllowed | checks db', async (t) => {
  sinon.stub(t.context.auth, 'validateApiKey').returns(true)
  t.true(await t.context.auth.isAdSessionAllowed({ headers: { authorization: 'bearer abc' } }))
  t.true(t.context.auth.validateApiKey.calledOnce)
})

test('getUISession | advertiser success', async (t) => {
  t.context.auth.docs.get().promise.resolves({
    Item: { sessionId: 'adv_sess', expires: 9999 }
  })
  const session = await t.context.auth.getUISession({
    cookies: {
      [advertiserSessionKey]: 'adv_sess'
    }
  }, t.context.auth.authKinds.ADVERTISER)
  t.deepEqual(session, { sessionId: 'adv_sess', expires: 9999 })
})

test('getUISession | advertiser no token', async (t) => {
  const session = await t.context.auth.getUISession({
    cookies: {}
  }, t.context.auth.authKinds.ADVERTISER)
  t.is(session, null)
})

test('getUISession | advertiser invalid token', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: {} })
  const session = await t.context.auth.getUISession({
    cookies: { [advertiserSessionKey]: 'adv_sess' }
  }, t.context.auth.authKinds.ADVERTISER)
  t.is(session, null)
})

test('getUISession | advertiser session expired', async (t) => {
  t.context.auth.docs.get().promise.resolves({
    Item: { sessionId: 'adv_sess', expires: 0 }
  })
  const session = await t.context.auth.getUISession({
    cookies: {}
  }, t.context.auth.authKinds.ADVERTISER)
  t.is(session, null)
})

test('getUISession | maintainer success', async (t) => {
  t.context.auth.docs.get().promise.resolves({
    Item: { sessionId: 'mnt_sess', expires: 9999 }
  })
  const session = await t.context.auth.getUISession({
    cookies: {
      [maintainerSessionKey]: 'mnt_sess'
    }
  }, t.context.auth.authKinds.MAINTAINER)
  t.deepEqual(session, { sessionId: 'mnt_sess', expires: 9999 })
})

test('getUISession | maintainer no token', async (t) => {
  const session = await t.context.auth.getUISession({
    cookies: {}
  }, t.context.auth.authKinds.MAINTAINER)
  t.is(session, null)
})

test('getUISession | maintainer invalid token', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: {} })
  const session = await t.context.auth.getUISession({
    cookies: {
      [maintainerSessionKey]: 'mnt_sess'
    }
  }, t.context.auth.authKinds.MAINTAINER)
  t.is(session, null)
})

test('getUISession | maintainer session expired', async (t) => {
  t.context.auth.docs.get().promise.resolves({
    Item: { sessionId: 'mnt_sess', expires: 0 }
  })
  const session = await t.context.auth.getUISession({
    cookies: {}
  }, t.context.auth.authKinds.MAINTAINER)
  t.is(session, null)
})

test('getUISession | dynamo throws', async (t) => {
  t.context.auth.docs.get().promise.rejects(new Error())
  const session = await t.context.auth.getUISession({
    cookies: {
      [maintainerSessionKey]: 'mnt_sess'
    }
  }, t.context.auth.authKinds.MAINTAINER)
  t.is(session, null)
})

test('getUISession | invalid kind', async (t) => {
  t.context.auth.getSessionToken = () => 'token'
  const session = await t.context.auth.getUISession({
    cookies: {}
  }, 'chickpea')
  t.is(session, null)
})

test('sendUserToken | missing params', async (t) => {
  await t.throwsAsync(t.context.auth.sendUserToken())
})

test('sendUserToken | success', async (t) => {
  await t.context.auth.sendUserToken('pam@dundermifflin.com', t.context.auth.authKinds.USER)
  t.deepEqual(t.context.auth.docs.put.lastCall.args, [
    {
      TableName: 'flossbank_user_auth',
      Item: {
        email: 'pam@dundermifflin.com',
        token: 'ff',
        kind: t.context.auth.authKinds.USER,
        expires: Date.now() + (15 * 60 * 1000)
      }
    }
  ])
  t.deepEqual(
    t.context.auth.ses.sendEmail.lastCall.args[0].Destination.ToAddresses,
    ['pam@dundermifflin.com']
  )
})

test('sendUserToken | invalid kind', async (t) => {
  await t.throwsAsync(t.context.auth.sendUserToken('pam@dundermifflin.com', 'chickpea'))
})

test('deleteUserToken | missing params', async (t) => {
  await t.context.auth.deleteUserToken()
  t.true(t.context.auth.docs.delete.notCalled)
})

test('deleteUserToken | success', async (t) => {
  await t.context.auth.deleteUserToken('email')
  t.true(t.context.auth.docs.delete.calledWith({
    TableName: 'flossbank_user_auth',
    Key: { email: 'email' }
  }))
})

test('validateUserToken | missings params', async (t) => {
  t.false(await t.context.auth.validateUserToken())
  t.false(await t.context.auth.validateUserToken('email'))
  t.false(await t.context.auth.validateUserToken(undefined, 'token'))
  t.false(await t.context.auth.validateUserToken('email', 'token', undefined))
})

test('validateUserToken | no user', async (t) => {
  t.context.auth.docs.get().promise.resolves({})
  t.false(await t.context.auth.validateUserToken('email', 'token', t.context.auth.authKinds.USER))
})

test('validateUserToken | invalid kind', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'email', token: 'token', kind: 'notUser' } })
  t.false(await t.context.auth.validateUserToken('email', 'token', t.context.auth.authKinds.USER))
})

test('validateUserToken | no hex token or no expires', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'email', kind: t.context.auth.authKinds.USER, token: '' } })
  t.false(await t.context.auth.validateUserToken('email', 'token', t.context.auth.authKinds.USER))
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'email', kind: t.context.auth.authKinds.USER, token: 'aa' } })
  t.false(await t.context.auth.validateUserToken('email', 'token', t.context.auth.authKinds.USER))
  t.true(t.context.auth.docs.delete.calledTwice)
})

test('validateUserToken | expired', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'email', token: 't', kind: t.context.auth.authKinds.USER, expires: 1 } })
  t.false(await t.context.auth.validateUserToken('email', 'token', t.context.auth.authKinds.USER))
  t.true(t.context.auth.docs.delete.calledOnce)
})

test('validateUserToken | not equal', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'email', kind: t.context.auth.authKinds.USER, token: '00', expires: 2345 } })
  t.false(await t.context.auth.validateUserToken('email', '01', t.context.auth.authKinds.USER))
  t.true(t.context.auth.docs.delete.calledOnce)
})

test('validateUserToken | success', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'email', kind: t.context.auth.authKinds.USER, token: '01', expires: 2345 } })
  t.true(await t.context.auth.validateUserToken('email', '01', t.context.auth.authKinds.USER))
  t.true(t.context.auth.docs.update.calledOnce)
})

test('validateUserToken | wrong kind', async (t) => {
  t.context.auth.docs.get().promise.resolves({
    Item: {
      email: 'email',
      kind: t.context.auth.authKinds.ADVERTISER,
      token: '01',
      expires: 2345
    }
  })
  t.false(await t.context.auth.validateUserToken('email', '01', t.context.auth.authKinds.USER))
})

test('validateUserToken | already valid', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: { email: 'email', kind: t.context.auth.authKinds.USER, token: '01', expires: 2345, valid: true } })
  t.true(await t.context.auth.validateUserToken('email', '01', t.context.auth.authKinds.USER))
  t.true(t.context.auth.docs.update.notCalled)
})

test('validateCaptcha | calls validate user token', async (t) => {
  sinon.stub(t.context.auth, 'validateUserToken')
  await t.context.auth.validateCaptcha('email', 'token', 'response')
  t.true(t.context.auth.validateUserToken.calledWith('email', 'token', t.context.auth.authKinds.USER))
})

test('validateCaptcha | failure', async (t) => {
  t.context.auth.post.returns({ body: JSON.stringify({ success: false }) })
  sinon.stub(t.context.auth, 'validateUserToken').returns(true)
  await t.context.auth.validateCaptcha('email', 'token', 'response')
  t.true(t.context.auth.post.calledWith('https://www.google.com/recaptcha/api/siteverify'))
  t.true(t.context.auth.docs.delete.calledOnce)
})

test('validateCaptcha | success', async (t) => {
  sinon.stub(t.context.auth, 'validateUserToken').returns(true)
  await t.context.auth.validateCaptcha('email', 'token', 'response')
  t.true(t.context.auth.post.calledWith('https://www.google.com/recaptcha/api/siteverify'))
  t.true(t.context.auth.docs.delete.calledOnce)
})

test('validateApiKey | missing params', async (t) => {
  t.false(await t.context.auth.validateApiKey())
})

test('validateApiKey | get failure', async (t) => {
  t.context.auth.docs.get().promise.rejects()
  t.false(await t.context.auth.validateApiKey('ff'))
})

test('validateApiKey | falsy item', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: null })
  t.false(await t.context.auth.validateApiKey('ff'))
})

test('validateApiKey | success', async (t) => {
  t.context.auth.docs.get().promise.resolves({ Item: {} })
  t.true(await t.context.auth.validateApiKey('ff'))
})

test('getOrCreateApiKey | first time', async (t) => {
  t.context.auth.docs.query().promise.resolves({ Items: [] }) // no matches in DB

  t.is(await t.context.auth.getOrCreateApiKey('pete@dov.com'), 'ff')

  const updateCall = t.context.auth.docs.update.lastCall.args[0]

  t.deepEqual(updateCall.Key, { key: 'ff' })
  t.deepEqual(updateCall.ExpressionAttributeValues, {
    ':email': 'pete@dov.com',
    ':now': 1234,
    ':one': 1
  })
})

test('getOrCreateApiKey | second time', async (t) => {
  t.context.auth.docs.query().promise.resolves({ Items: [{ key: 'bb', email: 'pete@dov.com' }] })

  t.is(await t.context.auth.getOrCreateApiKey('pete@dov.com'), 'bb')

  const updateCall = t.context.auth.docs.update.lastCall.args[0]

  t.deepEqual(updateCall.Key, { key: 'bb' })
  t.deepEqual(updateCall.ExpressionAttributeValues, {
    ':email': 'pete@dov.com',
    ':now': 1234,
    ':one': 1
  })
})

test('getOrCreateApiKey | strips address tags', async (t) => {
  t.context.auth.docs.query().promise.resolves({ Items: [] })

  await t.context.auth.getOrCreateApiKey('pete+asdf@dov.com')
  const queryCall = t.context.auth.docs.query.lastCall.args[0]

  t.deepEqual(queryCall.ExpressionAttributeValues, { ':email': 'pete@dov.com' })
})

test('getOrCreateApiKey | wonky email', async (t) => {
  t.context.auth.docs.query().promise.resolves({ Items: [] })

  await t.throwsAsync(
    () => t.context.auth.getOrCreateApiKey('pete+asdf'),
    { message: 'invalid email provided to getOrCreateApiKey: pete+asdf' }
  )
})

test('createAdSession | creates and persists session', async (t) => {
  const sessionId = await t.context.auth.createAdSession({
    headers: {
      authorization: 'bearer xyz'
    }
  })
  t.deepEqual(t.context.auth.docs.put.lastCall.args, [{
    TableName: 'flossbank_ad_session',
    Item: {
      sessionId: 'ff',
      apiKey: 'xyz',
      created: 1234
    }
  }])
  t.deepEqual(sessionId, 'ff')
})

test('createMaintainerSession | creates and persists session', async (t) => {
  const sessionId = await t.context.auth.createMaintainerSession('aabbcc')
  const weekExpiration = (7 * 24 * 60 * 1000)
  t.deepEqual(t.context.auth.docs.put.lastCall.args, [{
    TableName: 'flossbank_maintainer_session',
    Item: { sessionId: 'ff', expires: 1234 + weekExpiration, maintainerId: 'aabbcc' }
  }])
  t.deepEqual(sessionId, 'ff')
})

test('deleteMaintainerSession | deletes session token', async (t) => {
  const sessionId = await t.context.auth.createMaintainerSession('aabbcc')
  await t.context.auth.deleteMaintainerSession(sessionId)
  t.true(t.context.auth.docs.delete.calledWith({
    TableName: 'flossbank_maintainer_session',
    Key: { sessionId }
  }))
})

test('deleteMaintainerSession | no token', async (t) => {
  await t.context.auth.deleteMaintainerSession()
  t.true(t.context.auth.docs.delete.notCalled)
})

test('createAdvertiserSession | creates and persists session', async (t) => {
  const sessionId = await t.context.auth.createAdvertiserSession('aabbcc')
  const weekExpiration = (7 * 24 * 60 * 1000)
  t.true(t.context.auth.docs.put.calledWith({
    TableName: 'flossbank_advertiser_session',
    Item: { sessionId: 'ff', expires: 1234 + weekExpiration, advertiserId: 'aabbcc' }
  }))
  t.deepEqual(sessionId, 'ff')
})

test('deleteAdvertiserSession | deletes session token', async (t) => {
  const sessionId = await t.context.auth.createAdvertiserSession('aabbcc')
  await t.context.auth.deleteAdvertiserSession(sessionId)
  t.true(t.context.auth.docs.delete.calledWith({
    TableName: 'flossbank_advertiser_session',
    Key: { sessionId }
  }))
})

test('deleteAdvertiserSession | no token', async (t) => {
  await t.context.auth.deleteAdvertiserSession()
  t.true(t.context.auth.docs.delete.notCalled)
})
