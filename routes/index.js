const Schema = require('@flossbank/schema')

// Health
const health = require('../api/health')

// Subscribe
const betaSubscribe = require('../api/subscribe/beta-subscribe')
const betaUnSubscribe = require('../api/subscribe/beta-unsubscribe')

// Ad
// const createAd = require('../api/ad/create')

// Customer feedback
const sendFeedback = require('../api/support/feedback')

// Ad Campaigns
// const createAdCampaign = require('../api/adCampaign/create')
// const updateAdCampaign = require('../api/adCampaign/update')
// const activateAdCampaign = require('../api/adCampaign/activate')
// const getAdCampaign = require('../api/adCampaign/get')
// const getAdCampaigns = require('../api/adCampaign/get-all')

// Advertiser
// const registerAdvertiser = require('../api/advertiser/register')
// const getAdvertiser = require('../api/advertiser/get')
// const loginAdvertiser = require('../api/advertiser/login')
// const logoutAdvertiser = require('../api/advertiser/logout')
// const updateAdvertiserBilling = require('../api/advertiser/update-billing')
// const verifyAdvertiser = require('../api/advertiser/verify')
// const resumeAdvertiserSession = require('../api/advertiser/resume')

// User
const resumeUserSession = require('../api/user/resume')
const registerUser = require('../api/user/register')
const verifyUserRegistration = require('../api/user/verify-registration')
const requestLoginUser = require('../api/user/request-login')
const completeLoginUser = require('../api/user/complete-login')
const newInstallUser = require('../api/user/new-install')
const completeInstallUser = require('../api/user/complete-install')
const updateUserBilling = require('../api/user/update-billing')
const logoutUser = require('../api/user/logout')
const createUserDonation = require('../api/user/donation-create')
const updateUserDonation = require('../api/user/donation-update')
const deleteUserDonation = require('../api/user/donation-delete')
const getInstalledPackages = require('../api/user/get-installed-packages')
const getUserDonationInfo = require('../api/user/get-donation-info')
const getUserSessions = require('../api/user/get-sessions')
const githubAuthUser = require('../api/user/github-auth')
const getIsUserGithubOrganizationAdmin = require('../api/user/is-github-organization-admin')

// Organization
const orgGithubAuth = require('../api/organization/github-auth')
const createOrgDonation = require('../api/organization/donation-create')
const getOrgDonationInfo = require('../api/organization/get-donation-info')
const updateOrgDonation = require('../api/organization/donation-update')
const deleteOrgDonation = require('../api/organization/donation-delete')
const createGitHubOrganization = require('../api/organization/github-create')
const getOrganization = require('../api/organization/get')
const getOrgOssUsage = require('../api/organization/get-oss-usage')
const getOrgByName = require('../api/organization/get-org-by-name')
const updateOrg = require('../api/organization/update')
const getOrgDonationLedger = require('../api/organization/get-donation-ledger')

// Maintainer
const updateMaintainerUsername = require('../api/maintainer/update-username')
const requestLoginMaintainer = require('../api/maintainer/request-login')
const registerMaintainer = require('../api/maintainer/register')
const getMaintainerPendingPayout = require('../api/maintainer/get-pending-payout')
const updateMaintainerIlp = require('../api/maintainer/update-ilp-pointer')
const ownedPackages = require('../api/maintainer/owned-packages')

// Packages
const searchPackagesByName = require('../api/package/search-by-name')
const getPackage = require('../api/package/get')
const registries = {
  npm: {
    ownership: require('../api/package/npm/ownership'),
    delete: require('../api/package/npm/delete-ownership'),
    refresh: require('../api/package/npm/refresh-ownership')
  },
  rubygems: {
    ownership: require('../api/package/rubygems/ownership'),
    delete: require('../api/package/rubygems/delete-ownership'),
    refresh: require('../api/package/rubygems/refresh-ownership')
  }
}
const getSupportingCompanies = require('../api/package/get-supporting-companies')
const updatePackageMaintainerRevenueShares = require('../api/package/update-maintainer-revenue')

// Session
const startSession = require('../api/session/start')
const completeSession = require('../api/session/complete')

// Middleware
const userWebMiddleware = require('../middleware/userWeb')
const userCliMiddleware = require('../middleware/userCli')
// const advertiserWebMiddleware = require('../middleware/advertiser')

// URL
// const createUrl = require('../api/url/create')
// const getUrl = require('../api/url/get')

async function routes (fastify, opts, done) {
  if (opts.csrf) {
    fastify.use((req, res, next) => {
      if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return next()
      }
      if (req.headers['x-requested-with'] !== 'XmlHttpRequest') {
        res.writeHead(403)
        return res.end()
      }
      return next()
    })
  }

  // Health
  fastify.get('/health', { logLevel: 'error' }, health)
  fastify.post('/health', { logLevel: 'error' }, health)

  // Contact us
  fastify.post('/support/feedback', { schema: Schema.support.feedback }, (req, res) => sendFeedback(req, res, fastify))

  // Beta tester email subscriptions
  fastify.post('/beta/subscribe', { schema: Schema.subscribe.betaSubscribe }, (req, res) => betaSubscribe(req, res, fastify))
  fastify.post('/beta/unsubscribe', { schema: Schema.subscribe.betaUnsubscribe }, (req, res) => betaUnSubscribe(req, res, fastify))

  // Ad
  // fastify.post('/ad/create', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.ad.create }, (req, res) => createAd(req, res, fastify))

  // Ad Campaigns
  // fastify.post('/ad-campaign/create', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.adCampaign.create }, (req, res) => createAdCampaign(req, res, fastify))
  // fastify.post('/ad-campaign/update', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.adCampaign.update }, (req, res) => updateAdCampaign(req, res, fastify))
  // fastify.post('/ad-campaign/activate', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.adCampaign.activate }, (req, res) => activateAdCampaign(req, res, fastify))
  // fastify.get('/ad-campaign/get', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.adCampaign.get }, (req, res) => getAdCampaign(req, res, fastify))
  // fastify.get('/ad-campaign/get-all', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.adCampaign.getAll }, (req, res) => getAdCampaigns(req, res, fastify))

  // Advertiser
  // fastify.post('/advertiser/register', { schema: Schema.advertiser.register }, (req, res) => registerAdvertiser(req, res, fastify))
  // fastify.get('/advertiser/get', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.advertiser.get }, (req, res) => getAdvertiser(req, res, fastify))
  // fastify.post('/advertiser/login', { schema: Schema.advertiser.login }, (req, res) => loginAdvertiser(req, res, fastify))
  // fastify.post('/advertiser/logout', { schema: Schema.advertiser.logout }, (req, res) => logoutAdvertiser(req, res, fastify))
  // fastify.post('/advertiser/update-billing', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.advertiser.updateBilling }, (req, res) => updateAdvertiserBilling(req, res, fastify))
  // fastify.post('/advertiser/verify', { schema: Schema.advertiser.verify }, (req, res) => verifyAdvertiser(req, res, fastify))
  // fastify.get('/advertiser/resume', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done) }, (req, res) => resumeAdvertiserSession(req, res, fastify))

  // User
  fastify.post('/user/register', { schema: Schema.user.register }, (req, res) => registerUser(req, res, fastify))
  fastify.post('/user/github-auth', { schema: Schema.user.githubAuth }, (req, res) => githubAuthUser(req, res, fastify))
  fastify.post('/user/verify-registration', { schema: Schema.user.verifyRegistration }, (req, res) => verifyUserRegistration(req, res, fastify))
  fastify.post('/user/request-login', { schema: Schema.user.requestLogin }, (req, res) => requestLoginUser(req, res, fastify))
  fastify.post('/user/complete-login', { schema: Schema.user.completeLogin }, (req, res) => completeLoginUser(req, res, fastify))
  fastify.post('/user/complete-install', { schema: Schema.user.completeInstall }, (req, res) => completeInstallUser(req, res, fastify))
  fastify.post('/user/logout', { schema: Schema.user.logout }, (req, res) => logoutUser(req, res, fastify))
  fastify.get('/user/resume', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.resumeSession }, (req, res) => resumeUserSession(req, res, fastify))
  fastify.post('/user/update-billing', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.updateBilling }, (req, res) => updateUserBilling(req, res, fastify))
  fastify.post('/user/new-install', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.newInstall }, (req, res) => newInstallUser(req, res, fastify))
  fastify.post('/user/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.createDonation }, (req, res) => createUserDonation(req, res, fastify))
  fastify.put('/user/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.updateDonation }, (req, res) => updateUserDonation(req, res, fastify))
  fastify.delete('/user/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.deleteDonation }, (req, res) => deleteUserDonation(req, res, fastify))
  fastify.get('/user/get-installed-packages', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.getInstalledPackages }, (req, res) => getInstalledPackages(req, res, fastify))
  fastify.get('/user/get-donation-info', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.getDonationInfo }, (req, res) => getUserDonationInfo(req, res, fastify))
  fastify.get('/user/get-sessions', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.getSessions }, (req, res) => getUserSessions(req, res, fastify))
  fastify.get('/user/is-github-organization-admin', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.user.isGithubOrgAdmin }, (req, res) => getIsUserGithubOrganizationAdmin(req, res, fastify))

  // Organization
  fastify.post('/organization/github-auth', { schema: Schema.organization.githubAuth }, (req, res) => orgGithubAuth(req, res, fastify))
  fastify.get('/organization', { schema: Schema.organization.getByName }, (req, res) => getOrgByName(req, res, fastify))
  fastify.get('/organization/:organizationId', (req, res) => getOrganization(req, res, fastify))
  fastify.post('/organization/github-create', { schema: Schema.organization.githubCreate }, (req, res) => createGitHubOrganization(req, res, fastify))
  fastify.post('/organization/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.createDonation }, (req, res) => createOrgDonation(req, res, fastify))
  fastify.put('/organization/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.updateDonation }, (req, res) => updateOrgDonation(req, res, fastify))
  fastify.delete('/organization/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.deleteDonation }, (req, res) => deleteOrgDonation(req, res, fastify))
  fastify.get('/organization/get-donation-info', { schema: Schema.organization.getDonationInfo }, (req, res) => getOrgDonationInfo(req, res, fastify))
  fastify.get('/organization/get-oss-usage', { schema: Schema.organization.getOssUsage }, (req, res) => getOrgOssUsage(req, res, fastify))
  fastify.put('/organization', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.update }, (req, res) => updateOrg(req, res, fastify))
  fastify.get('/organization/get-donation-ledger', { schema: Schema.organization.getDonationLedger }, (req, res) => getOrgDonationLedger(req, res, fastify))

  // Maintainer
  fastify.put('/maintainer/update-username', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.maintainer.updateUsername }, (req, res) => updateMaintainerUsername(req, res, fastify))
  fastify.post('/maintainer/request-login', { schema: Schema.user.requestLogin }, (req, res) => requestLoginMaintainer(req, res, fastify))
  fastify.post('/maintainer/register', { schema: Schema.user.register }, (req, res) => registerMaintainer(req, res, fastify))
  fastify.put('/maintainer/update-ilp-pointer', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.maintainer.updateIlpPointer }, (req, res) => updateMaintainerIlp(req, res, fastify))
  fastify.get('/maintainer/owned-packages', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.maintainer.ownedPackages }, (req, res) => ownedPackages(req, res, fastify))
  fastify.get('/maintainer/pending-payout', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.maintainer.pendingPayout }, (req, res) => getMaintainerPendingPayout(req, res, fastify))

  // Packages
  fastify.put('/package/maintainer-revenue-share', { schema: Schema.package.updateMaintainerRevenueShares, preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done) }, (req, res) => updatePackageMaintainerRevenueShares(req, res, fastify))
  fastify.get('/package/search', { schema: Schema.package.searchByName }, (req, res) => searchPackagesByName(req, res, fastify))
  fastify.get('/package', { schema: Schema.package.get }, (req, res) => getPackage(req, res, fastify))
  fastify.post('/package/npm/ownership', { schema: Schema.package.npm.ownership, preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done) }, (req, res) => registries.npm.ownership(req, res, fastify))
  fastify.delete('/package/npm/ownership', { schema: Schema.package.npm.deleteOwnership, preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done) }, (req, res) => registries.npm.delete(req, res, fastify))
  fastify.put('/package/npm/refresh-ownership', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.package.npm.refreshOwnership }, (req, res) => registries.npm.refresh(req, res, fastify))
  fastify.post('/package/rubygems/ownership', { schema: Schema.package.rubygems.ownership, preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done) }, (req, res) => registries.rubygems.ownership(req, res, fastify))
  fastify.delete('/package/rubygems/ownership', { schema: Schema.package.rubygems.deleteOwnership, preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done) }, (req, res) => registries.rubygems.delete(req, res, fastify))
  fastify.put('/package/rubygems/refresh-ownership', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.package.rubygems.refreshOwnership }, (req, res) => registries.rubygems.refresh(req, res, fastify))
  fastify.get('/package/get-supporting-companies', { schema: Schema.package.getSupportingCompanies }, (req, res) => getSupportingCompanies(req, res, fastify))

  // Session
  fastify.post('/session/start', { preHandler: (req, res, done) => userCliMiddleware(req, res, fastify, done), schema: Schema.session.start }, (req, res) => startSession(req, res, fastify))
  fastify.post('/session/complete', { preHandler: (req, res, done) => userCliMiddleware(req, res, fastify, done), schema: Schema.session.complete }, (req, res) => completeSession(req, res, fastify))

  // URL
  // fastify.post('/url/create', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.url.create }, (req, res) => createUrl(req, res, fastify))
  // fastify.get('/u/:id', (req, res) => getUrl(req, res, fastify))

  done()
}

module.exports = routes
