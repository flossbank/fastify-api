const fastifyPlugin = require('fastify-plugin')
const got = require('got')

class GitHub {
  constructor ({ config }) {
    this.config = config
    this.got = got
  }

  async requestAccessToken ({ code, state }) {
    try {
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
    } catch (e) {
      throw new Error(`Github request access token threw: ${e.message}`)
    }
  }

  async requestUserData ({ accessToken }) {
    try {
      const res = await this.makeAuthedReq('get', 'https://api.github.com/user', accessToken)
      const { email } = JSON.parse(res.body)
      return { email }
    } catch (e) {
      throw new Error(`Github request user data threw: ${e.message}`)
    }
  }

  async getUserOrgs ({ accessToken }) {
    try {
      const res = await this.makeAuthedReq('get', 'https://api.github.com/user/orgs', accessToken)
      return { orgsData: JSON.parse(res.body) }
    } catch (e) {
      throw new Error(`Github request user orgs threw: ${e.message}`)
    }
  }

  async makeAuthedReq (method, endpoint, accessToken) {
    return this.got[method](endpoint, {
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
