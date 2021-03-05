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

  const membership = {
    url: 'https://api.github.com/orgs/teacherfund/memberships/stripedpajamas',
    state: 'active',
    role: 'admin',
    organization_url: 'https://api.github.com/orgs/teacherfund',
    user: {
      login: 'stripedpajamas',
      id: 2707340,
      node_id: 'MDQ6VXNlcjI3MDczNDA=',
      avatar_url: 'https://avatars.githubusercontent.com/u/2707340?v=4',
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
    },
    organization: {
      login: 'teacherfund',
      id: 46003582,
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjQ2MDAzNTgy',
      url: 'https://api.github.com/orgs/teacherfund',
      repos_url: 'https://api.github.com/orgs/teacherfund/repos',
      events_url: 'https://api.github.com/orgs/teacherfund/events',
      hooks_url: 'https://api.github.com/orgs/teacherfund/hooks',
      issues_url: 'https://api.github.com/orgs/teacherfund/issues',
      members_url: 'https://api.github.com/orgs/teacherfund/members{/member}',
      public_members_url: 'https://api.github.com/orgs/teacherfund/public_members{/member}',
      avatar_url: 'https://avatars.githubusercontent.com/u/46003582?v=4',
      description: ''
    }
  }

  const user = {
    login: 'stripedpajamas',
    id: 2707340,
    node_id: 'MDQ6VXNlcjI3MDczNDA=',
    avatar_url: 'https://avatars.githubusercontent.com/u/2707340?v=4',
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
    site_admin: false,
    name: 'Peter Squicciarini',
    company: null,
    blog: '',
    location: 'Seattle, WA',
    email: null,
    hireable: true,
    bio: null,
    twitter_username: 'pajamaboat',
    public_repos: 195,
    public_gists: 4,
    followers: 125,
    following: 152,
    created_at: '2012-11-02T14:34:23Z',
    updated_at: '2021-03-05T18:00:21Z'
  }

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

  got.get.onCall(0).resolves({ body: user })
  got.get.onCall(1).resolves({ body: membership })

  t.is(await github.isUserAnOrgAdmin({ userGitHubId: 2707340, organization }), true)
  t.true(got.get.calledWith('https://api.github.com/user/2707340'))
  t.true(got.get.calledWith('https://api.github.com/orgs/teacherfund/memberships/stripedpajamas'))

  got.get.reset()
  got.get.onCall(0).resolves({
    body: {
      login: 'notsomeonewhoadministersteacherfund'
    }
  })
  const error404 = new Error('not found')
  error404.response = { statusCode: 404 }
  got.get.onCall(1).rejects(error404)
  t.is(await github.isUserAnOrgAdmin({ userGitHubId: 1234567, organization }), false)
  t.true(got.get.calledWith('https://api.github.com/user/1234567'))
  t.true(got.get.calledWith('https://api.github.com/orgs/teacherfund/memberships/notsomeonewhoadministersteacherfund'))

  // fallback logic uses the public list of members
  got.get.reset()
  got.get.rejects(new Error('you cannot find the username!'))
  got.paginate.all.resolves(admins)
  t.is(await github.isUserAnOrgAdmin({ userGitHubId: 2707340, organization }), true)

  t.true(got.get.calledWith('https://api.github.com/user/2707340'))
  t.true(got.paginate.all.calledWith('https://api.github.com/orgs/teacherfund/members'))

  // fallback logic is also triggered in the case where the first GH call succeeds
  // but the second one fails
  got.get.reset()
  got.get.onCall(0).resolves({ body: user })
  got.get.onCall(1).rejects(new Error()) // not a 404

  got.paginate.all.resolves(admins)
  t.is(await github.isUserAnOrgAdmin({ userGitHubId: 2707340, organization }), true)

  t.true(got.get.calledWith('https://api.github.com/user/2707340'))
  t.true(got.paginate.all.calledWith('https://api.github.com/orgs/teacherfund/members'))
})
