const test = require('ava')
const nock = require('nock')
const RubyGemsRegistry = require('../../registry/rubygems')

const rogueGem = {
  name: 'hola_pedro',
  downloads: 86,
  version: '0.0.0',
  version_created_at: '2021-03-22T20:57:08.707Z',
  version_downloads: 86,
  sha: '7a7c883a256ea80774a7b91b4ab79ada485f10bcad4d7ba36b29d11c65bc0d60',
  project_uri: 'https://rubygems.org/gems/hola_joelwasserman',
  dependencies: {
    development: [],
    runtime: []
  }
}

const gems = [
  {
    name: 'hola_joelwasserman',
    downloads: 86,
    version: '0.0.0',
    version_created_at: '2021-03-22T20:57:08.707Z',
    version_downloads: 86,
    platform: 'ruby',
    authors: 'Joel Wasserman',
    info: 'A simple hello world gem',
    licenses: [
      'MIT'
    ],
    metadata: {},
    yanked: false,
    sha: '7a7c883a256ea80774a7b91b4ab79ada485f10bcad4d7ba36b29d11c65bc0d60',
    project_uri: 'https://rubygems.org/gems/hola_joelwasserman',
    gem_uri: 'https://rubygems.org/gems/hola_joelwasserman-0.0.0.gem',
    homepage_uri: 'https://rubygems.org/gems/hola_joelwasserman',
    wiki_uri: null,
    documentation_uri: 'https://www.rubydoc.info/gems/hola_joelwasserman/0.0.0',
    mailing_list_uri: null,
    source_code_uri: null,
    bug_tracker_uri: null,
    changelog_uri: null,
    funding_uri: null,
    dependencies: {
      development: [],
      runtime: []
    }
  },
  {
    name: 'hello_stripedpajamas',
    downloads: 167,
    version: '0.0.1',
    version_created_at: '2021-01-15T01:21:16.546Z',
    version_downloads: 167,
    platform: 'ruby',
    authors: 'Peter Squicciarini',
    info: 'Hello from stripedpajamas',
    licenses: [
      'MIT'
    ],
    metadata: {},
    yanked: false,
    sha: 'd7554271cc22bb35c5df841590812fe4ab5d7ed94fcc293086fdbb08c56f01ae',
    project_uri: 'https://rubygems.org/gems/hello_stripedpajamas',
    gem_uri: 'https://rubygems.org/gems/hello_stripedpajamas-0.0.1.gem',
    homepage_uri: null,
    wiki_uri: null,
    documentation_uri: 'https://www.rubydoc.info/gems/hello_stripedpajamas/0.0.1',
    mailing_list_uri: null,
    source_code_uri: null,
    bug_tracker_uri: null,
    changelog_uri: null,
    funding_uri: null,
    dependencies: {
      development: [],
      runtime: []
    }
  }
]

test.beforeEach((t) => {
  const reg = new RubyGemsRegistry()
  t.context.reg = reg
})

test.afterEach((t) => {
  nock.cleanAll()
})

// afaik these tests have to be serial since we're mocking API calls
test.serial('tokenUsernameMatch | calls registry with token, then with username', async (t) => {
  const { reg } = t.context

  const token = 'blahblahblah'
  const username = 'stripedpajamas'

  // token here
  nock(reg.constants.registry, {
    reqheaders: {
      authorization: token
    }
  }).get('/api/v1/gems.json')
    .reply(200, gems)

  // no token here
  nock(reg.constants.registry)
    .get('/api/v1/owners/stripedpajamas/gems.json')
    .reply(200, gems)

  const tokenUsernameMatch = await reg.tokenUsernameMatch({ readOnlyToken: token, username })
  t.true(tokenUsernameMatch)
})

test.serial('tokenUsernameMatch | no match because rubygems api changed on us and returns non arrays', async (t) => {
  const { reg } = t.context

  const token = 'blahblahblah'
  const username = 'stripedpajamas'

  // non array response
  nock(reg.constants.registry, {
    reqheaders: {
      authorization: token
    }
  }).get('/api/v1/gems.json')
    .reply(200, gems[0])

  // array response
  nock(reg.constants.registry)
    .get('/api/v1/owners/stripedpajamas/gems.json')
    .reply(200, gems)

  const tokenUsernameMatch = await reg.tokenUsernameMatch({ readOnlyToken: token, username })
  t.false(tokenUsernameMatch)
})

test.serial('tokenUsernameMatch | no match because lengths of responses are different', async (t) => {
  const { reg } = t.context

  const token = 'blahblahblah'
  const username = 'stripedpajamas'

  // array response of just 1 of the gems
  nock(reg.constants.registry, {
    reqheaders: {
      authorization: token
    }
  }).get('/api/v1/gems.json')
    .reply(200, [gems[0]])

  // array response of both gems
  nock(reg.constants.registry)
    .get('/api/v1/owners/stripedpajamas/gems.json')
    .reply(200, gems)

  const tokenUsernameMatch = await reg.tokenUsernameMatch({ readOnlyToken: token, username })
  t.false(tokenUsernameMatch)
})

test.serial('tokenUsernameMatch | no match | different values in responses', async (t) => {
  const { reg } = t.context

  const token = 'blahblahblah'
  const username = 'stripedpajamas'

  // Include rogue gem in response from first call
  nock(reg.constants.registry, {
    reqheaders: {
      authorization: token
    }
  }).get('/api/v1/gems.json')
    .reply(200, [gems[0], rogueGem])

  // expected list of gems
  nock(reg.constants.registry)
    .get('/api/v1/owners/stripedpajamas/gems.json')
    .reply(200, gems)

  const tokenUsernameMatch = await reg.tokenUsernameMatch({ readOnlyToken: token, username })
  t.false(tokenUsernameMatch)
})

test.serial('getOwnedPackages | returns packages', async (t) => {
  const { reg } = t.context

  const username = 'stripedpajamas'

  nock(reg.constants.registry)
    .get(`/api/v1/owners/${username}/gems.json`)
    .reply(200, gems)

  const packages = await reg.getOwnedPackages({ username })

  t.deepEqual(packages, [
    'hola_joelwasserman',
    'hello_stripedpajamas'
  ])
})
