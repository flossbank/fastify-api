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

// Organization
const githubListOrgs = require('../api/organization/github-list-orgs')
const chooseOrg = require('../api/organization/choose')
const createOrgDonation = require('../api/organization/donation-create')
const getOrgDonationInfo = require('../api/organization/get-donation-info')
const updateOrgDonation = require('../api/organization/donation-update')
const deleteOrgDonation = require('../api/organization/donation-delete')
const getOrgImpact = require('../api/organization/get-impact')

// Maintainer
// const getMaintainer = require('../api/maintainer/get')
// const loginMaintainer = require('../api/maintainer/login')
// const logoutMaintainer = require('../api/maintainer/logout')
// const registerMaintainer = require('../api/maintainer/register')
// const maintainerRevenue = require('../api/maintainer/revenue')
// const updateMaintainerPayout = require('../api/maintainer/update-payout')
// const verifyMaintainer = require('../api/maintainer/verify')
// const resumeMaintainerSession = require('../api/maintainer/resume')

// Packages
// const getPackages = require('../api/package/get')
// const refreshPackages = require('../api/package/refresh')
// const updatePackages = require('../api/package/update')

// Session
const startSession = require('../api/session/start')
const completeSession = require('../api/session/complete')

// Middleware
const userWebMiddleware = require('../middleware/userWeb')
const userCliMiddleware = require('../middleware/userCli')
// const advertiserWebMiddleware = require('../middleware/advertiser')
// const maintainerWebMiddleware = require('../middleware/maintainer')

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

  // Organizatoin
  fastify.get('/organization/github-list-orgs', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.githubListOrgs }, (req, res) => githubListOrgs(req, res, fastify))
  fastify.post('/organization/choose', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.chooseOrg }, (req, res) => chooseOrg(req, res, fastify))
  fastify.post('/organization/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.createDonation }, (req, res) => createOrgDonation(req, res, fastify))
  fastify.put('/organization/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.updateDonation }, (req, res) => updateOrgDonation(req, res, fastify))
  fastify.delete('/organization/donation', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.deleteDonation }, (req, res) => deleteOrgDonation(req, res, fastify))
  fastify.get('/organization/get-donation-info', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done), schema: Schema.organization.getDonationInfo }, (req, res) => getOrgDonationInfo(req, res, fastify))
  fastify.get('/organization/get-impact', { preHandler: (req, res, done) => userWebMiddleware(req, res, fastify, done) }, (req, res) => getOrgImpact(req, res, fastify))

  // Maintainer
  // fastify.get('/maintainer/get', { preHandler: (req, res, done) => maintainerWebMiddleware(req, res, fastify, done), schema: Schema.maintainer.get }, (req, res) => getMaintainer(req, res, fastify))
  // fastify.post('/maintainer/login', { schema: Schema.maintainer.login }, (req, res) => loginMaintainer(req, res, fastify))
  // fastify.post('/maintainer/logout', { schema: Schema.maintainer.logout }, (req, res) => logoutMaintainer(req, res, fastify))
  // fastify.post('/maintainer/register', { schema: Schema.maintainer.register }, (req, res) => registerMaintainer(req, res, fastify))
  // fastify.get('/maintainer/revenue', { preHandler: (req, res, done) => maintainerWebMiddleware(req, res, fastify, done), schema: Schema.maintainer.revenue }, (req, res) => maintainerRevenue(req, res, fastify))
  // fastify.post('/maintainer/update-payout', { preHandler: (req, res, done) => maintainerWebMiddleware(req, res, fastify, done), schema: Schema.maintainer.updatePayout }, (req, res) => updateMaintainerPayout(req, res, fastify))
  // fastify.post('/maintainer/verify', { schema: Schema.maintainer.verify }, (req, res) => verifyMaintainer(req, res, fastify))
  // fastify.get('/maintainer/resume', { preHandler: (req, res, done) => maintainerWebMiddleware(req, res, fastify, done) }, (req, res) => resumeMaintainerSession(req, res, fastify))

  // Packages
  // fastify.get('/package/get', { preHandler: (req, res, done) => maintainerWebMiddleware(req, res, fastify, done), schema: Schema.package.get }, (req, res) => getPackages(req, res, fastify))
  // fastify.post('/package/refresh', { preHandler: (req, res, done) => maintainerWebMiddleware(req, res, fastify, done), schema: Schema.package.refresh }, (req, res) => refreshPackages(req, res, fastify))
  // fastify.post('/package/update', { preHandler: (req, res, done) => maintainerWebMiddleware(req, res, fastify, done), schema: Schema.package.update }, (req, res) => updatePackages(req, res, fastify))

  // Session
  fastify.post('/session/start', { preHandler: (req, res, done) => userCliMiddleware(req, res, fastify, done), schema: Schema.session.start }, (req, res) => startSession(req, res, fastify))
  fastify.post('/session/complete', { preHandler: (req, res, done) => userCliMiddleware(req, res, fastify, done), schema: Schema.session.complete }, (req, res) => completeSession(req, res, fastify))

  // URL
  // fastify.post('/url/create', { preHandler: (req, res, done) => advertiserWebMiddleware(req, res, fastify, done), schema: Schema.url.create }, (req, res) => createUrl(req, res, fastify))
  // fastify.get('/u/:id', (req, res) => getUrl(req, res, fastify))

  done()
}

module.exports = routes
