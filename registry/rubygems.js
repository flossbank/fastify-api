const got = require('got')

class RubyGemsRegistry {
  constructor () {
    this.constants = {
      registry: 'https://rubygems.org/'
    }
    this.got = got.extend({
      prefixUrl: this.constants.registry
    })
  }

  async tokenUsernameMatch ({ readOnlyToken, username }) {
    const { body: tokenResponse } = await this.got.get('api/v1/gems.json', {
      headers: {
        authorization: readOnlyToken
      },
      responseType: 'json'
    })

    const { body: usernameResponse } = await this.got.get(`api/v1/owners/${username}/gems.json`, {
      responseType: 'json'
    })

    if (!Array.isArray(tokenResponse) || !Array.isArray(usernameResponse)) {
      return false
    }

    if (tokenResponse.length !== usernameResponse.length) {
      return false
    }

    // not sure if rubygems always returns the gem list in the same order, so sorting by name first
    const tokenOwnedGems = tokenResponse.map(({ name }) => name)
    const usernameOwnedGems = usernameResponse.map(({ name }) => name)

    // default JS sort will work here since the default is lexicographical
    // and we only have a list of names
    tokenOwnedGems.sort()
    usernameOwnedGems.sort()

    // compare the two lists
    for (let i = 0; i < tokenOwnedGems.length; i++) {
      if (tokenOwnedGems[i] !== usernameOwnedGems[i]) return false
    }

    return true
  }

  // returns list of package names that the provided username has ownership rights to
  async getOwnedPackages ({ username }) {
    const { body: packages } = await this.got.get(`api/v1/owners/${username}/gems.json`, {
      responseType: 'json'
    })

    // we only care about names!
    return (packages || []).map(({ name }) => name)
  }
}

module.exports = RubyGemsRegistry
