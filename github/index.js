const fastifyPlugin = require('fastify-plugin')
const got = require('got')

class GitHub {
  constructor ({ config }) {
    this.config = config
    this.got = got
  }

  async requestAccessToken ({ code, state }) {
    return this.got.post('https://github.com/login/oauth/access_token', {
      responseType: 'json',
      json: {
        code,
        state,
        client_id: this.config.getGitHubClientId(),
        client_secret: this.config.getGitHubClientSecret()
      }
    })
  }
}

exports.GitHub = GitHub

exports.githubPlugin = (github) => fastifyPlugin(async (fastify) => {
  fastify.decorate('github', github)
})
