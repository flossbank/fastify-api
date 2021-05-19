const fetch = require('npm-registry-fetch')

class NpmRegistry {
  constructor () {
    this.constants = {
      registry: 'https://registry.npmjs.org/',
      registryNerf: '//registry.npmjs.org/',
      readWrite: 'read-write',
      write: 'write'
    }
  }

  async getUsername ({ readOnlyToken }) {
    const opts = {
      registry: this.constants.registry,
      token: readOnlyToken,
      forceAuth: {
        _authToken: readOnlyToken
      }
    }

    // will throw in the case of an invalid token
    const userData = await fetch.json('/-/npm/v1/user', opts)
    const { name } = userData

    return name
  }

  // returns list of package names that the provided username has read-write/write access to
  async getOwnedPackages ({ username }) {
    const packages = await fetch.json(`/-/org/${username}/package`)

    const { readWrite, write } = this.constants
    return Object.keys(packages).filter((pkg) => packages[pkg] === readWrite || packages[pkg] === write)
  }
}

module.exports = NpmRegistry
