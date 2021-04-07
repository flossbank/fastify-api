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
    const { id: githubId } = JSON.parse(res.body)
    return { githubId }
  }

  async requestUserEmail ({ accessToken }) {
    const res = await this.makeAuthedReq('get', 'https://api.github.com/user/emails', accessToken)

    const emails = JSON.parse(res.body)

    // filter for the primary address (every GitHub account has a primary email address on it)
    return emails.filter(email => email.primary).map(({ email }) => email).pop()
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

    // first determine the user's current username from their ID using an undocumented endpoint
    // if this fails, we fall back to accessing the list of public members
    try {
      const { body: user } = await this.got.get(`https://api.github.com/user/${userGitHubId}`, {
        responseType: 'json'
      })
      const { login: username } = user

      try {
        const { body: membership } = await this.got.get(`https://api.github.com/orgs/${name}/memberships/${username}`, {
          responseType: 'json',
          headers: {
            accept: 'application/vnd.github.v3+json',
            Authorization: `Bearer ${token}`
          }
        })

        const { role, state } = membership
        return role === 'admin' && state === 'active'
      } catch (e) {
        const { response } = e
        if (response && response.statusCode === 404) {
          console.warn(`Got 404 from orgs/${name}/memberships/${username} call`)
          // if this call fails with 404 but the first one succeeds, they aren't an admin
          return false
        }
        throw e
      }
    } catch (e) {
      console.warn('Unable to retrieve username or membership status:', e)
      console.warn('Attempting to determine membership status via public list')
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
