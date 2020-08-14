const fastifyPlugin = require('fastify-plugin')
const got = require('got')

class GitHub {
  constructor ({ config }) {
    this.config = config
    this.got = got
  }

  async requestAccessToken ({ code, state }) {
    const res = await this.got.post('https://github.com/login/oauth/access_token', {
      responseType: 'json',
      json: {
        code,
        state,
        client_id: this.config.getGitHubClientId(),
        client_secret: this.config.getGitHubClientSecret()
      }
    })
    return res.body
  }

  async requestUserData ({ accessToken }) {
    const res = await this.got.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return JSON.parse(res.body)
  }
}

exports.GitHub = GitHub

exports.githubPlugin = (github) => fastifyPlugin(async (fastify) => {
  fastify.decorate('github', github)
})
