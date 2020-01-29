const test = require('ava')
const sinon = require('sinon')
const { base32 } = require('rfc4648')
const { Url } = require('../../url')

test.before(() => {
  sinon.stub(base32, 'stringify').returns('asdf')
})

test.beforeEach((t) => {
  t.context.url = new Url()
  t.context.url.docs = {
    put: sinon.stub().returns({
      promise: sinon.stub().resolves()
    }),
    update: sinon.stub().returns({
      promise: sinon.stub().resolves({
        Attributes: { location: 'http://localhost.com' }
      })
    })
  }
})

test.after.always(() => {
  base32.stringify.restore()
})

test('url | create', async (t) => {
  const id = await t.context.url.createUrl('http://localhost.com', 1234)
  t.is(id, 'https://api.flossbank.io/u/asdf')
})

test('url | create collision', async (t) => {
  const e = new Error()
  e.code = 'ConditionalCheckFailedException'
  t.context.url.docs.put().promise.rejects(e)

  await t.throwsAsync(
    t.context.url.createUrl('http://localhost.com', 1234),
    'unable to create unique url'
  )
})

test('url | create failure', async (t) => {
  t.context.url.docs.put().promise.rejects(new Error('dynamo is borked'))

  await t.throwsAsync(
    t.context.url.createUrl('http://localhost.com', 1234),
    'dynamo is borked'
  )
})

test('url | get', async (t) => {
  const location = await t.context.url.getUrl('asdf')
  t.is(location, 'http://localhost.com')
})

test('url | get not found', async (t) => {
  const e = new Error()
  e.code = 'ConditionalCheckFailedException'
  t.context.url.docs.update().promise.rejects(e)

  const location = await t.context.url.getUrl('asdf')
  t.is(location, null)
})

test('url | get failure', async (t) => {
  t.context.url.docs.update().promise.rejects(new Error('dynamo is borked'))

  await t.throwsAsync(t.context.url.getUrl('asdf'), 'dynamo is borked')
})
