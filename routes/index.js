// Health
const health = require('../api/health')

// Subscribe
const betaSubscribe = require('../api/subscribe/betaSubscribe')
const betaSubscribeSchema = require('../schema/subscribe/betaSubscribe')
const betaUnSubscribe = require('../api/subscribe/betaUnsubscribe')
const betaUnSubscribeSchema = require('../schema/subscribe/betaUnsubscribe')

// Ad
const createAd = require('../api/ad/create')
const createAdSchema = require('../schema/ad/create')

// Ad Campaigns
const createAdCampaign = require('../api/adCampaign/create')
const createAdCampaignSchema = require('../schema/adCampaign/create')
const updateAdCampaign = require('../api/adCampaign/update')
const updateAdCampaignSchema = require('../schema/adCampaign/update')
const activateAdCampaign = require('../api/adCampaign/activate')
const activateAdCampaignSchema = require('../schema/adCampaign/activate')
const getAdCampaign = require('../api/adCampaign/get')
const getAdCampaignSchema = require('../schema/adCampaign/get')
const getAdCampaigns = require('../api/adCampaign/get-all')
const getAdCampaignsSchema = require('../schema/adCampaign/get-all')

// Advertiser
const registerAdvertiser = require('../api/advertiser/register')
const registerAdvertiserSchema = require('../schema/advertiser/register')
const getAdvertiser = require('../api/advertiser/get')
const getAdvertiserSchema = require('../schema/advertiser/get')
const loginAdvertiser = require('../api/advertiser/login')
const loginAdvertiserSchema = require('../schema/advertiser/login')
const logoutAdvertiser = require('../api/advertiser/logout')
const updateAdvertiserBilling = require('../api/advertiser/updateBilling')
const updateAdvertiserBillingSchema = require('../schema/advertiser/updateBilling')
const verifyAdvertiser = require('../api/advertiser/verify')
const verifyAdvertiserSchema = require('../schema/advertiser/verify')
const resumeAdvertiserSession = require('../api/advertiser/resume')

// User
const registerUser = require('../api/user/register')
const registerUserSchema = require('../schema/user/register')
const validateCaptcha = require('../api/user/validate-captcha')
const validateCaptchaSchema = require('../schema/user/validate-captcha')
const verifyUser = require('../api/user/verify')
const verifyUserSchema = require('../schema/user/verify')
const checkUser = require('../api/user/check')
const checkUserSchema = require('../schema/user/check')

// Maintainer
const getMaintainer = require('../api/maintainer/get')
const getMaintainerSchema = require('../schema/maintainer/get')
const loginMaintainer = require('../api/maintainer/login')
const loginMaintainerSchema = require('../schema/maintainer/login')
const logoutMaintainer = require('../api/maintainer/logout')
const registerMaintainer = require('../api/maintainer/register')
const registerMaintainerSchema = require('../schema/maintainer/register')
const maintainerRevenue = require('../api/maintainer/revenue')
const maintainerRevenueSchema = require('../schema/maintainer/revenue')
const updateMaintainer = require('../api/maintainer/update')
const updateMaintainerSchema = require('../schema/maintainer/update')
const verifyMaintainer = require('../api/maintainer/verify')
const verifyMaintainerSchema = require('../schema/maintainer/verify')
const resumeMaintainerSession = require('../api/maintainer/resume')

// Packages
const getPackages = require('../api/package/get')
const getPackagesSchema = require('../schema/package/get')
const refreshPackages = require('../api/package/refresh')
const refreshPackagesSchema = require('../schema/package/refresh')
const updatePackages = require('../api/package/update')
const updatePackagesSchema = require('../schema/package/update')

// Session
const startSession = require('../api/session/start')
const startSessionSchema = require('../schema/session/start')
const completeSession = require('../api/session/complete')
const completeSessionSchema = require('../schema/session/complete')

// Middleware
const advertiserUIAuthMiddleware = require('../middleware/advertiser')
const maintainerUIAuthMiddleware = require('../middleware/maintainer')

// URL
const createUrl = require('../api/url/create')
const createUrlSchema = require('../schema/url/create')
const getUrl = require('../api/url/get')

async function routes (fastify, opts, next) {
  // Health
  fastify.get('/health', { logLevel: 'error' }, health)
  fastify.post('/health', { logLevel: 'error' }, health)

  // Beta tester email subscriptions
  fastify.post('/beta/subscribe', { schema: betaSubscribeSchema }, (req, res) => betaSubscribe(req, res, fastify))
  fastify.post('/beta/unsubscribe', { schema: betaUnSubscribeSchema }, (req, res) => betaUnSubscribe(req, res, fastify))

  // Ad
  fastify.post('/ad/create', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: createAdSchema }, (req, res) => createAd(req, res, fastify))

  // Ad Campaigns
  fastify.post('/ad-campaign/create', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: createAdCampaignSchema }, (req, res) => createAdCampaign(req, res, fastify))
  fastify.post('/ad-campaign/update', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: updateAdCampaignSchema }, (req, res) => updateAdCampaign(req, res, fastify))
  fastify.post('/ad-campaign/activate', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: activateAdCampaignSchema }, (req, res) => activateAdCampaign(req, res, fastify))
  fastify.get('/ad-campaign/get', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: getAdCampaignSchema }, (req, res) => getAdCampaign(req, res, fastify))
  fastify.get('/ad-campaign/get-all', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: getAdCampaignsSchema }, (req, res) => getAdCampaigns(req, res, fastify))

  // Advertiser
  fastify.post('/advertiser/register', { schema: registerAdvertiserSchema }, (req, res) => registerAdvertiser(req, res, fastify))
  fastify.get('/advertiser/get', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: getAdvertiserSchema }, (req, res) => getAdvertiser(req, res, fastify))
  fastify.post('/advertiser/login', { schema: loginAdvertiserSchema }, (req, res) => loginAdvertiser(req, res, fastify))
  fastify.post('/advertiser/logout', (req, res) => logoutAdvertiser(req, res, fastify))
  fastify.post('/advertiser/update/billing', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: updateAdvertiserBillingSchema }, (req, res) => updateAdvertiserBilling(req, res, fastify))
  fastify.post('/advertiser/verify', { schema: verifyAdvertiserSchema }, (req, res) => verifyAdvertiser(req, res, fastify))
  fastify.get('/advertiser/resume', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done) }, (req, res) => resumeAdvertiserSession(req, res, fastify))

  // User
  fastify.post('/user/register', { schema: registerUserSchema }, (req, res) => registerUser(req, res, fastify))
  fastify.post('/user/validate-captcha', { schema: validateCaptchaSchema }, (req, res) => validateCaptcha(req, res, fastify))
  fastify.post('/user/verify', { schema: verifyUserSchema }, (req, res) => verifyUser(req, res, fastify))
  fastify.post('/user/check', { schema: checkUserSchema }, (req, res) => checkUser(req, res, fastify))

  // Maintainer
  fastify.get('/maintainer/get', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: getMaintainerSchema }, (req, res) => getMaintainer(req, res, fastify))
  fastify.post('/maintainer/login', { schema: loginMaintainerSchema }, (req, res) => loginMaintainer(req, res, fastify))
  fastify.post('/maintainer/logout', (req, res) => logoutMaintainer(req, res, fastify))
  fastify.post('/maintainer/register', { schema: registerMaintainerSchema }, (req, res) => registerMaintainer(req, res, fastify))
  fastify.get('/maintainer/revenue', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: maintainerRevenueSchema }, (req, res) => maintainerRevenue(req, res, fastify))
  fastify.post('/maintainer/update', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: updateMaintainerSchema }, (req, res) => updateMaintainer(req, res, fastify))
  fastify.post('/maintainer/verify', { schema: verifyMaintainerSchema }, (req, res) => verifyMaintainer(req, res, fastify))
  fastify.get('/maintainer/resume', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done) }, (req, res) => resumeMaintainerSession(req, res, fastify))

  // Packages
  fastify.get('/package/get', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: getPackagesSchema }, (req, res) => getPackages(req, res, fastify))
  fastify.post('/package/refresh', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: refreshPackagesSchema }, (req, res) => refreshPackages(req, res, fastify))
  fastify.post('/package/update', { preHandler: (req, res, done) => maintainerUIAuthMiddleware(req, res, fastify, done), schema: updatePackagesSchema }, (req, res) => updatePackages(req, res, fastify))

  // Session
  fastify.post('/session/start', { schema: startSessionSchema }, (req, res) => startSession(req, res, fastify))
  fastify.post('/session/complete', { schema: completeSessionSchema }, (req, res) => completeSession(req, res, fastify))

  // URL
  fastify.post('/url/create', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: createUrlSchema }, (req, res) => createUrl(req, res, fastify))
  fastify.get('/u/:id', (req, res) => getUrl(req, res, fastify))

  next()
}

module.exports = routes
