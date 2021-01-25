const test = require('ava')
const nock = require('nock')
const NpmRegistry = require('../../registry/npm')

test.beforeEach((t) => {
  const reg = new NpmRegistry()
  t.context.reg = reg
})

test.afterEach((t) => {
  nock.cleanAll()
})

// afaik these tests have to be serial since we're mocking API calls
test.serial('getUsername | calls registry with token', async (t) => {
  const { reg } = t.context

  const token = 'blahblahblah'

  nock(reg.constants.registry, {
    reqheaders: {
      authorization: `Bearer ${token}`
    }
  }).get('/-/npm/v1/user')
    .reply(200, {
      name: 'twoseventythree'
    })

  const username = await reg.getUsername({ readOnlyToken: token })
  t.is(username, 'twoseventythree')
})

test.serial('getOwnedPackages | returns packages', async (t) => {
  const { reg } = t.context

  const username = 'twoseventythree'

  nock(reg.constants.registry)
    .get(`/-/org/${username}/package`)
    .reply(200, {
      'js-deep-equals': 'read-write',
      papajohns: 'read',
      dominos: 'write'
    })

  const packages = await reg.getOwnedPackages({ username })

  t.deepEqual(packages, [
    'js-deep-equals',
    'dominos'
  ])
})
