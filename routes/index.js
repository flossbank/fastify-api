// Health
const health = require('../api/health')

// Ad
const getAd = require('../api/ad/get')
const getAdSchema = require('../schema/ad/get')

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
const updateAdvertiser = require('../api/advertiser/update')
const updateAdvertiserSchema = require('../schema/advertiser/update')
const verifyAdvertiser = require('../api/advertiser/verify')
const verifyAdvertiserSchema = require('../schema/advertiser/verify')
const resumeAdvertiserSession = require('../api/advertiser/resume')

// Auth
const sendAuth = require('../api/auth/send')
const sendAuthSchema = require('../schema/auth/send')
const validateCaptcha = require('../api/auth/validate-captcha')
const validateCaptchaSchema = require('../schema/auth/validate-captcha')
const validateEmail = require('../api/auth/validate-email')
const validateEmailSchema = require('../schema/auth/validate-email')

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
const completeSession = require('../api/session/complete')
const completeSessionSchema = require('../schema/session/complete')

// Middleware
const advertiserUIAuthMiddleware = require('../middleware/advertiser')
const maintainerUIAuthMiddleware = require('../middleware/maintainer')

async function routes (fastify, opts, next) {
  // Health
  fastify.get('/health', health)

  // Ad
  fastify.post('/ad/get', { schema: getAdSchema }, (req, res) => getAd(req, res, fastify))

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
  fastify.post('/advertiser/update', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done), schema: updateAdvertiserSchema }, (req, res) => updateAdvertiser(req, res, fastify))
  fastify.post('/advertiser/verify', { schema: verifyAdvertiserSchema }, (req, res) => verifyAdvertiser(req, res, fastify))
  fastify.get('/advertiser/resume', { preHandler: (req, res, done) => advertiserUIAuthMiddleware(req, res, fastify, done) }, (req, res) => resumeAdvertiserSession(req, res, fastify))

  // Auth
  fastify.post('/auth/send', { schema: sendAuthSchema }, (req, res) => sendAuth(req, res, fastify))
  fastify.post('/auth/validate-captcha', { schema: validateCaptchaSchema }, (req, res) => validateCaptcha(req, res, fastify))
  fastify.post('/auth/validate-email', { schema: validateEmailSchema }, (req, res) => validateEmail(req, res, fastify))

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
  fastify.post('/session/complete', { schema: completeSessionSchema }, (req, res) => completeSession(req, res, fastify))

  next()
}

module.exports = routes
