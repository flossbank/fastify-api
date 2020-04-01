const Schema = require('@flossbank/schema')

// Health
const health = require('../api/health')

// Subscribe
const betaSubscribe = require('../api/subscribe/betaSubscribe')
const betaUnSubscribe = require('../api/subscribe/betaUnsubscribe')

// Ad
const createAd = require('../api/ad/create')

// Ad Campaigns
const createAdCampaign = require('../api/adCampaign/create')
const updateAdCampaign = require('../api/adCampaign/update')
const activateAdCampaign = require('../api/adCampaign/activate')
const getAdCampaign = require('../api/adCampaign/get')
const getAdCampaigns = require('../api/adCampaign/get-all')

// Advertiser
const registerAdvertiser = require('../api/advertiser/register')
const getAdvertiser = require('../api/advertiser/get')
const loginAdvertiser = require('../api/advertiser/login')
const logoutAdvertiser = require('../api/advertiser/logout')
const updateAdvertiserBilling = require('../api/advertiser/updateBilling')
const verifyAdvertiser = require('../api/advertiser/verify')
const resumeAdvertiserSession = require('../api/advertiser/resume')

// User
const registerUser = require('../api/user/register')
const validateCaptcha = require('../api/user/validate-captcha')
const verifyUser = require('../api/user/verify')
const checkUser = require('../api/user/check')
const loginUser = require('../api/user/login')
const authUser = require('../api/user/authenticate')
const logoutUser = require('../api/user/logout')
const optOutUser = require('../api/user/opt-out')

// Maintainer
const getMaintainer = require('../api/maintainer/get')
const loginMaintainer = require('../api/maintainer/login')
const logoutMaintainer = require('../api/maintainer/logout')
const registerMaintainer = require('../api/maintainer/register')
const maintainerRevenue = require('../api/maintainer/revenue')
const updateMaintainerPayout = require('../api/maintainer/updatePayout')
const verifyMaintainer = require('../api/maintainer/verify')
const resumeMaintainerSession = require('../api/maintainer/resume')

// Packages
const getPackages = require('../api/package/get')
const refreshPackages = require('../api/package/refresh')
const updatePackages = require('../api/package/update')

// Session
const startSession = require('../api/session/start')
const completeSession = require('../api/session/complete')

// Middleware
const userUIAuthMiddleware = require('../middleware/user')
const advertiserUIAuthMiddleware = require('../middleware/advertiser')
const maintainerUIAuthMiddleware = require('../middleware/maintainer')

// URL
const createUrl = require('../api/url/create')
const getUrl = require('../api/url/get')

async function routes (fastify, opts, next) {
  // Health
  fastify.get('/health', { logLevel: 'error' }, health)
  fastify.post('/health', { logLevel: 'error' }, health)

  // Beta tester email subscriptions
  fastify.post('/beta/subscribe', { schema: Schema.subscribe.betaSubscribe }, (req, res) => betaSubscribe(req, res, fastify))
  fastify.post('/beta/unsubscribe', { schema: Schema.subscribe.betaUnsubscribe }, (req, res) => betaUnSubscribe(req, res, fastify))

  // Ad
  fastify.post('/ad/create', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.ad.create }, (req, res) => createAd(req, res, fastify))

  // Ad Campaigns
  fastify.post('/ad-campaign/create', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.adCampaign.create }, (req, res) => createAdCampaign(req, res, fastify))
  fastify.post('/ad-campaign/update', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.adCampaign.update }, (req, res) => updateAdCampaign(req, res, fastify))
  fastify.post('/ad-campaign/activate', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.adCampaign.activate }, (req, res) => activateAdCampaign(req, res, fastify))
  fastify.get('/ad-campaign/get', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.adCampaign.get }, (req, res) => getAdCampaign(req, res, fastify))
  fastify.get('/ad-campaign/get-all', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.adCampaign.getAll }, (req, res) => getAdCampaigns(req, res, fastify))

  // Advertiser
  fastify.post('/advertiser/register', { schema: Schema.advertiser.register }, (req, res) => registerAdvertiser(req, res, fastify))
  fastify.get('/advertiser/get', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.advertiser.get }, (req, res) => getAdvertiser(req, res, fastify))
  fastify.post('/advertiser/login', { schema: Schema.advertiser.login }, (req, res) => loginAdvertiser(req, res, fastify))
  fastify.post('/advertiser/logout', { schema: Schema.advertiser.logout }, (req, res) => logoutAdvertiser(req, res, fastify))
  fastify.post('/advertiser/update/billing', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.advertiser.updateBilling }, (req, res) => updateAdvertiserBilling(req, res, fastify))
  fastify.post('/advertiser/verify', { schema: Schema.advertiser.verify }, (req, res) => verifyAdvertiser(req, res, fastify))
  fastify.get('/advertiser/resume', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done) }, (req, res) => resumeAdvertiserSession(req, res, fastify))

  // User
  fastify.post('/user/register', { schema: Schema.user.register }, (req, res) => registerUser(req, res, fastify))
  fastify.post('/user/validate-captcha', { schema: Schema.user.validateCaptcha }, (req, res) => validateCaptcha(req, res, fastify))
  fastify.post('/user/verify', { schema: Schema.user.verify }, (req, res) => verifyUser(req, res, fastify))
  fastify.post('/user/check', { schema: Schema.user.check }, (req, res) => checkUser(req, res, fastify))
  fastify.post('/user/login', { schema: Schema.user.login }, (req, res) => loginUser(req, res, fastify))
  fastify.post('/user/authenticate', { schema: Schema.user.authenticate }, (req, res) => authUser(req, res, fastify))
  fastify.post('/user/logout', { schema: Schema.user.logout }, (req, res) => logoutUser(req, res, fastify))
  fastify.post('/user/opt-out', { preHandler: (req, res, done) => userUIAuthMiddleware(req, res, fastify, done), schema: Schema.user.optOut }, (req, res) => optOutUser(req, res, fastify))

  // Maintainer
  fastify.get('/maintainer/get', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: Schema.maintainer.get }, (req, res) => getMaintainer(req, res, fastify))
  fastify.post('/maintainer/login', { schema: Schema.maintainer.login }, (req, res) => loginMaintainer(req, res, fastify))
  fastify.post('/maintainer/logout', (req, res) => logoutMaintainer(req, res, fastify))
  fastify.post('/maintainer/register', { schema: Schema.maintainer.register }, (req, res) => registerMaintainer(req, res, fastify))
  fastify.get('/maintainer/revenue', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: Schema.maintainer.revenue }, (req, res) => maintainerRevenue(req, res, fastify))
  fastify.post('/maintainer/update-payout', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: Schema.maintainer.updatePayout }, (req, res) => updateMaintainerPayout(req, res, fastify))
  fastify.post('/maintainer/verify', { schema: Schema.maintainer.verify }, (req, res) => verifyMaintainer(req, res, fastify))
  fastify.get('/maintainer/resume', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done) }, (req, res) => resumeMaintainerSession(req, res, fastify))

  // Packages
  fastify.get('/package/get', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: Schema.package.get }, (req, res) => getPackages(req, res, fastify))
  fastify.post('/package/refresh', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: Schema.package.refresh }, (req, res) => refreshPackages(req, res, fastify))
  fastify.post('/package/update', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: Schema.package.update }, (req, res) => updatePackages(req, res, fastify))

  // Session
  fastify.post('/session/start', { schema: Schema.session.start }, (req, res) => startSession(req, res, fastify))
  fastify.post('/session/complete', { schema: Schema.session.complete }, (req, res) => completeSession(req, res, fastify))

  // URL
  fastify.post('/url/create', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: Schema.url.create }, (req, res) => createUrl(req, res, fastify))
  fastify.get('/u/:id', (req, res) => getUrl(req, res, fastify))

  next()
}

module.exports = routes
