const fastifyPlugin = require('fastify-plugin')
const ghGot = require('gh-got')

class GitHub {
  constructor ({ config }) {
    this.config = config
    this.ghGot = ghGot
  }

  async requestAccessToken ({ code, state }) {
    return this.ghGot('https://github.com/login/oauth/access_token', {
      code,
      state,
      client_id: this.config.getGitHubClientId(),
      client_secret: this.config.getGitHubClientSecret()
    })
  }
}

exports.GitHub = GitHub

exports.githubPlugin = (github) => fastifyPlugin(async (fastify) => {
  fastify.decorate('github', github)
})
