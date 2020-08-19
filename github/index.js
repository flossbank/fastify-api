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
    return res.body.access_token
  }

  async requestUserData ({ accessToken }) {
    const res = await this.makeAuthedReq('get', 'user', accessToken)
    const { email } = JSON.parse(res.body)
    return { email }
  }

  async getUserOrgs ({ accessToken }) {
    const res = await this.makeAuthedReq('get', 'user/orgs', accessToken)
    return { orgsData: JSON.parse(res.body) }
  }

  async makeAuthedReq (method, endpoint, accessToken) {
    const prefixedInstance = this.got.extend({
      prefixUrl: 'https://api.github.com'
    })
    return prefixedInstance[method](endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  }
}

exports.GitHub = GitHub

exports.githubPlugin = (github) => fastifyPlugin(async (fastify) => {
  fastify.decorate('github', github)
})
