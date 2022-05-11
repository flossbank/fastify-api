const RegistryResolver = require('@flossbank/registry-resolver')
const GithubRetriever = require('./github-manifest-retriever')
const got = require('got')

class DodTopLevelDependencyRetriever {
  constructor ({ db, config, s3, sqs }) {
    this.config = config
    this.got = got
    this.db = db
    this.sqs = sqs
    this.s3 = s3
    // no epsilon needed because we are only using the resolver to get search patterns
    this.resolver = new RegistryResolver({ log: console.log, epsilon: 0 })
    this.retriever = new GithubRetriever({ log: console.log, config })
  }

  async extractGitHubTopLevelDeps ({ record }) {
    const {
      correlationId,
      organizationId // the organization ID who is donating
    } = JSON.parse(record.body)

    // If no org id, throw
    if (!organizationId) throw Error('undefined organization id passed in')

    console.log({ organizationId, correlationId })

    const org = await this.db.getOrg({ organizationId })
    let installationId
    const { name, installationId: _installationId } = org

    // this is an org that hasn't installed our Github App; we will only be scraping their public repos,
    // and we'll authenticate via Flossbank's installation ID
    if (!_installationId) {
      const flossbank = await this.db.getOrg({ organizationId: this.config.getFlossbankOrgId() })
      installationId = flossbank.installationId

      // this shouldn't ever happen, so if it does we'll be noisy
      if (!installationId) throw new Error('no installation id found on flossbank org')
    } else {
      installationId = _installationId
    }

    // get manifest search patterns for each supported registry+language
    // e.g. "package.json" is the only manifest search pattern for JavaScript/NPM
    // this call returns a list of [{ registry, language, patterns }, ...]
    const searchPatterns = this.resolver.getSupportedManifestPatterns()
    console.log('Using %d search pattern(s) to find package manifest files within org', searchPatterns.length)

    // call the code host (e.g. GitHub) to search all the org's repos for each of the search patterns
    // this call returns a list of [{ registry, language, manifest }, ...] -- that is, a separate
    // object for each manifest file found, alongside its registry and language. the manifest is unparsed (raw utf8)
    const packageManifests = await this.retriever.getAllManifestsForOrg({ name, installationId }, searchPatterns)
    console.log('Downloaded %d package manifests', packageManifests.length)

    // now ask the registry resolver to parse the manifest files according to whichever registry/language they are
    // so, for example, { registry: npm, language: javascript, manifest: <some JSON string> } will be parsed as
    // JSON and the dependencies+devDependencies fields will be extracted as top level dependencies.
    // this call returns a list of [{ registry, language, deps }, ...] for each registry and language -- even if
    // there are many unique manifests passed in for the registry and language. it will group all the deps for
    // the registry/language combination into a single list.
    const extractedDependencies = this.resolver.extractDependenciesFromManifests(packageManifests)
    console.log('Dependencies extracted for %d different registry/language combinations', extractedDependencies.length)

    // Append reg/lang combos to extractedDependencies for each reg/lang combo that had no results
    // (e.g. if there were no package.json files in the org's repos)
    for (const { registry, language } of searchPatterns) {
      if (extractedDependencies.find((ed) => ed.registry === registry && ed.language === language)) continue
      extractedDependencies.push({ registry, language, deps: [] })
    }

    await this.publishDepsToS3({ correlationId, extractedDependencies })
    return { success: true }
  }

  async publishDepsToS3 ({ correlationId, extractedDependencies }) {
    console.log('Writing top level package lists to S3')
    await this.s3.putTopLevelPackages({ correlationId, extractedDependencies })

    console.log('Sending message to registry resolver for package weight map computation')
    await this.sqs.sendRegistryResolverMessage({ correlationId })
  }
}

module.exports = DodTopLevelDependencyRetriever
