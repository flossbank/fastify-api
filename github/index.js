const fastifyPlugin = require('fastify-plugin')
const { App } = require('@octokit/app')
const got = require('got')

class GitHub {
  constructor ({ config }) {
    this.config = config
    this.got = got

    const { id, privateKey } = this.config.getGithubAppConfig()
    this.app = new App({ id, privateKey })
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
    const res = await this.makeAuthedReq('get', 'https://api.github.com/user', accessToken)
    const { email, id: githubId } = JSON.parse(res.body)
    return { email, githubId }
  }

  async getUserOrgs ({ accessToken }) {
    const res = await this.makeAuthedReq('get', 'https://api.github.com/user/orgs', accessToken)
    return { orgsData: JSON.parse(res.body) }
  }

  async getInstallationDetails ({ installationId }) {
    const jwt = this.app.getSignedJsonWebToken() // ephemeral; expires in <10mins after creation; computed locally

    const { body } = await this.got.get(`https://api.github.com/app/installations/${installationId}`, {
      responseType: 'json',
      headers: {
        authorization: `Bearer ${jwt}`,
        accept: 'application/vnd.github.v3+json'
      }
    })

    return body
  }

  async isUserAnOrgAdmin ({ userGitHubId, organization }) {
    const { installationId, name } = organization
    const token = await this.app.getInstallationAccessToken({ installationId })

    // get org admins
    const admins = await this.got.paginate.all(
      `https://api.github.com/orgs/${name}/members`, {
        searchParams: {
          role: 'admin',
          per_page: 100
        },
        responseType: 'json',
        headers: {
          accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`
        }
      }
    )

    // return whether or not user's ID is one of the admins
    return !!admins.find(user => user.id === userGitHubId)
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
