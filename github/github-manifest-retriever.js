const got = require('got')
const limit = require('call-limit')
const minimatch = require('minimatch')
const { App } = require('@octokit/app')

const getRateLimit = headers => ({
  limit: parseInt(headers['x-ratelimit-limit'], 10),
  remaining: parseInt(headers['x-ratelimit-remaining'], 10),
  reset: new Date(parseInt(headers['x-ratelimit-reset'], 10) * 1000)
})

async function sleepUntil (date) {
  return new Promise((resolve) => {
    const now = Date.now()
    const then = date.getTime()
    if (now >= then) return resolve()

    setTimeout(() => resolve(), then - now)
  })
}

class GithubRetriever {
  constructor ({ log, config }) {
    this.log = log
    this.got = got.extend({
      prefixUrl: 'https://api.github.com',
      headers: {
        accept: 'application/vnd.github.v3+json',
        'user-agent': 'flossbank/distribute-org-donations'
      },
      responseType: 'json',
      handlers: [
        (options, next) => {
          // Auth
          if (options.token && !options.headers.authorization) {
            options.headers.authorization = `token ${options.token}`
          }
          // options.json -> options.json
          options.json = options.body
          delete options.body

          return next(options)
        }
      ],
      hooks: {
        init: [
          options => {
            if (typeof options.url === 'string' && options.url.startsWith('/')) {
              options.url = options.url.slice(1)
            }
          }
        ],
        afterResponse: [
          async (response, retry) => {
            const rateLimits = getRateLimit(response.headers)

            if (response.statusCode === 403) {
              // get the reset header and sleep
              const retryAt = new Date()
              retryAt.setTime(retryAt.getTime() + (3 * 60 * 1000)) // 3 minutes
              this.log.warn('Secondary rate limits reached; sleeping for (3) minutes until %s', retryAt.toString())
              await sleepUntil(retryAt)

              // rather than return the 403 to the calling code (which would throw), we instruct got to retry the original request
              return retry()
            }

            // we sleep even though we have a few requests remaining,
            // because if we use them all up and then sleep and then
            // make another request, there's a chance that GitHub servers
            // haven't yet "realized" that our rate limit has been reset
            // and we'll get a very nasty 403. having the extra requests
            // in our pocket means GitHub should have a chance to propagate
            // our new limits.
            if (rateLimits && rateLimits.remaining <= 5) {
              this.log.warn(
                'Rate limited while requesting (%s); continuing at %d (%s); (remaining: %d)',
                response.requestUrl,
                rateLimits.reset.getTime(),
                rateLimits.reset.toString(),
                rateLimits.remaining
              )
              rateLimits.reset.setTime(rateLimits.reset.getTime() + 750)
              await sleepUntil(rateLimits.reset)
            }

            return response
          }
        ]
      }
    })

    this.fetchFile = limit.promise(this.fetchFileFromRepo, 30) // limit to 30 concurrent downloads

    this.config = config
    this.app = null // needs init()
  }

  async init () {
    const { privateKey, id } = await this.config.getGithubAppConfig()
    this.app = new App({ id, privateKey })
  }

  // manifestSearchPatterns: [
  //   { registry, language, patterns } => [{ registry, language, manifest }, ...]
  // ]
  async getAllManifestsForOrg (org, manifestSearchPatterns) {
    const { name, installationId } = org
    if (!name || !installationId || !this.app) {
      throw new Error('need org name, installationId, and a valid GH app to get manifests')
    }
    const token = await this.app.getInstallationAccessToken({ installationId })

    const repos = await this.getOrgRepos(name, token)

    let manifests
    try {
      manifests = await this.getManifestsFromRepos(repos, manifestSearchPatterns, token)
    } catch (e) {
      if (e.response && e.response.body) this.log.error(e.response.body)
      else this.log.error(e)
      throw e
    }

    this.log.info('Found %d manifest files in %s', manifests.length, name)

    return manifests.flat()
  }

  async getManifestsFromRepos (repos, manifestSearchPatterns, token) {
    const manifests = []
    for (const repo of repos) {
      const searchResults = await this.searchForManifests(repo, manifestSearchPatterns, token)
      for (const { registry, language, file } of searchResults) {
        const manifest = await this.fetchFile(repo, file, token)
        manifests.push({ registry, language, manifest })
      }
    }

    return manifests
  }

  async getOrgRepos (org, token) {
    const options = {
      pagination: {
        filter: (item) => {
          // Repo's have an "archived" key on them in api v3 https://developer.github.com/v3/repos/
          // We don't want to distribute donations or count deps for any archived repositories.
          return !item.archived
        }
      },
      token
    }

    this.log.info('Getting repos for %s', org)
    // It's possible at some point in the future, github api https://developer.github.com/v3/repos/
    // will allow us to filter for non archived repos during the request. Until then, we'll fetch all
    // repos and filter the pagination response.
    const repos = await this.got.paginate.all(`orgs/${org}/repos`, options)

    return repos
  }

  async searchForManifests (repo, searchPatterns, token) {
    const patternToLangReg = new Map()
    for (const { registry, language, patterns } of searchPatterns) {
      for (const pattern of patterns) {
        patternToLangReg.set(pattern, { registry, language })
      }
    }

    const filenames = [...patternToLangReg.keys()].map(pattern => `filename:${pattern}`).join(' ')

    const options = {
      searchParams: { q: `${filenames} repo:${repo.full_name}`, per_page: 100 },
      pagination: {
        transform: async ({ body }) => {
          return (body.items || []).reduce((acc, file) => {
            if (file.path.includes('node_modules')) return acc
            for (const [pattern, { registry, language }] of patternToLangReg.entries()) {
              if (minimatch(file.name, pattern)) {
                return acc.concat({ registry, language, file })
              }
            }
            return acc
          }, [])
        },
        paginate: (response) => { // copied and mutated from https://github.com/sindresorhus/got/blob/v11.8.2/source/index.ts#L80
          if (!response.headers.link) {
            return false
          }

          const items = (response.headers.link).split(',')

          let next
          for (const item of items) {
            const parsed = item.split(';')

            if (parsed[1].includes('next')) {
              next = parsed[0].trimStart().trim()
              next = next.slice(1, -1)
              break
            }
          }

          if (next) {
            const url = new URL(next)

            const options = {
              searchParams: url.searchParams
            }

            return options
          }

          return false
        }
      },
      token
    }

    this.log.info('Searching for %s in %s', filenames, repo.full_name)
    const searchResults = await this.got.paginate.all('search/code', options)

    return searchResults
  }

  async fetchFileFromRepo (repo, file, token) {
    this.log.info('Fetching %s from %s', file.path, repo.full_name)
    const { path } = file
    const { body } = await this.got.get(`repos/${repo.owner.login}/${repo.name}/contents/${path}`, { token })
    const contents = Buffer.from(body.content, 'base64').toString('utf8')
    return contents
  }
}

module.exports = GithubRetriever
