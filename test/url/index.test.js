const test = require('ava')
const sinon = require('sinon')
const { Url } = require('../../url')

test.beforeEach((t) => {
  t.context.url = new Url()
  t.context.url.docs = {
    get: sinon.stub(),
    update: sinon.stub()
  }
})

test('url | create', async (t) => {
  const id = await t.context.url.createUrl('http://localhost.com', 1234)
  t.is(id, 'https://api.flossbank.io/u/asdf')
})

test('url | get', async (t) => {
  const location = await t.context.url.getUrl('asdf')
  t.is(location, 'http://localhost.com')
})
