const test = require('ava')
const sinon = require('sinon')
const { GitHub } = require('../../github')

test.beforeEach((t) => {
  t.context.github = new GitHub({
    config: {
      getGitHubClientId: () => 'valhalla',
      getGitHubClientSecret: () => 'valhalla_secret',
      getGithubAppConfig: () => ({ id: 'abc', privateKey: 'def' })
    }
  })
  t.context.github.got = {
    post: sinon.stub(),
    get: sinon.stub(),
    paginate: {
      all: sinon.stub()
    }
  }
})

test('constructs gh app', async (t) => {
  t.true(!!t.context.github.app)
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
  t.context.github.got.get.returns({ body: JSON.stringify({ email: 'joelwass@joel.com', id: 'id-1' }) })
  const res = await t.context.github.requestUserData({
    accessToken: 'test_access_token'
  })

  t.deepEqual(res, { email: 'joelwass@joel.com', githubId: 'id-1' })
})

test('github | get user orgs', async (t) => {
  t.context.github.got.get.returns({ body: JSON.stringify([{ login: 'flossbank' }]) })
  const res = await t.context.github.getUserOrgs({ accessToken: 'blah_blah' })

  t.deepEqual(res, { orgsData: [{ login: 'flossbank' }] })
})

test('getInstallationDetails', async (t) => {
  const { github } = t.context
  const { got, app } = github
  app.getSignedJsonWebToken = sinon.stub().returns('a gr8 jwt')
  got.get.returns({ body: { account: { login: 'flossbank' } } })

  await github.getInstallationDetails({ installationId: 'install123' })

  t.true(app.getSignedJsonWebToken.calledOnce)
  const { args } = got.get.lastCall
  const [url, options] = args
  t.true(url.includes('install123'))

  const { headers } = options
  const { authorization } = headers
  t.true(authorization.includes('a gr8 jwt'))
})

test('isUserAnOrgAdmin', async (t) => {
  const { github } = t.context
  const { got, app } = github

  app.getInstallationAccessToken = sinon.stub().returns('a gr8 token')

  const admins = [
    {
      login: 'joelwass',
      id: 7344422,
      node_id: 'MDQ6VXNlcjczNDQ0MjI=',
      avatar_url: 'https://avatars1.githubusercontent.com/u/7344422?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/joelwass',
      html_url: 'https://github.com/joelwass',
      followers_url: 'https://api.github.com/users/joelwass/followers',
      following_url: 'https://api.github.com/users/joelwass/following{/other_user}',
      gists_url: 'https://api.github.com/users/joelwass/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/joelwass/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/joelwass/subscriptions',
      organizations_url: 'https://api.github.com/users/joelwass/orgs',
      repos_url: 'https://api.github.com/users/joelwass/repos',
      events_url: 'https://api.github.com/users/joelwass/events{/privacy}',
      received_events_url: 'https://api.github.com/users/joelwass/received_events',
      type: 'User',
      site_admin: false
    },
    {
      login: 'stripedpajamas',
      id: 2707340,
      node_id: 'MDQ6VXNlcjI3MDczNDA=',
      avatar_url: 'https://avatars1.githubusercontent.com/u/2707340?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/stripedpajamas',
      html_url: 'https://github.com/stripedpajamas',
      followers_url: 'https://api.github.com/users/stripedpajamas/followers',
      following_url: 'https://api.github.com/users/stripedpajamas/following{/other_user}',
      gists_url: 'https://api.github.com/users/stripedpajamas/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/stripedpajamas/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/stripedpajamas/subscriptions',
      organizations_url: 'https://api.github.com/users/stripedpajamas/orgs',
      repos_url: 'https://api.github.com/users/stripedpajamas/repos',
      events_url: 'https://api.github.com/users/stripedpajamas/events{/privacy}',
      received_events_url: 'https://api.github.com/users/stripedpajamas/received_events',
      type: 'User',
      site_admin: false
    }
  ]

  const organization = {
    _id: '5f95f9de4027a735034a00be',
    name: 'teacherfund',
    host: 'GitHub',
    installationId: '12598695',
    email: null,
    avatarUrl: 'https://avatars1.githubusercontent.com/u/46003582?v=4',
    globalDonation: false,
    billingInfo: {},
    donationAmount: 0,
    donationChanges: []
  }
  got.paginate.all.resolves(admins)

  t.is(await github.isUserAnOrgAdmin({ userGitHubId: 2707340, organization }), true)
  t.is(await github.isUserAnOrgAdmin({ userGitHubId: 1234567, organization }), false)
})
