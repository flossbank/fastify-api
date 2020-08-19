const test = require('ava')
const sinon = require('sinon')
const { GitHub } = require('../../github')

test.beforeEach((t) => {
  t.context.github = new GitHub({
    config: {
      getGitHubClientId: () => 'valhalla',
      getGitHubClientSecret: () => 'valhalla_secret'
    }
  })
  t.context.github.got = {
    post: sinon.stub(),
    get: sinon.stub(),
  }
  t.context.github.got.extend = sinon.stub().returns(t.context.github.got)
})

test('github | request access token with state and code', async (t) => {
  t.context.github.got.post.returns({ body: { access_token: 'blah' } })
  const res = await t.context.github.requestAccessToken({
    code: 'test_code',
    state: 'test_state'
  })

  t.deepEqual(res, 'blah')
})

test('github | request user info', async (t) => {
  t.context.github.got.get.returns({ body: JSON.stringify({ email: 'joelwass@joel.com' }) })
  const res = await t.context.github.requestUserData({
    accessToken: 'test_access_token'
  })

  t.deepEqual(res, { email: 'joelwass@joel.com' })
})

test('github | get user orgs', async (t) => {
  t.context.github.got.get.returns({ body: JSON.stringify([{ login: 'flossbank' }]) })
  const res = await t.context.github.getUserOrgs({ accessToken: 'blah_blah' })

  t.deepEqual(res, { orgsData: [{ login: 'flossbank' }] })
})
