// Ads
const createAd = require('../api/ad/create')
const createAdSchema = require('../schema/ad/create')
const getAllAds = require('../api/ad/get-all')
const getAllAdsSchema = require('../schema/ad/get-all')
const getAd = require('../api/ad/get')
const getAdSchema = require('../schema/ad/get')
const updateAd = require('../api/ad/update')
const updateAdSchema = require('../schema/ad/update')

// Ad Campaigns
const createAdCampaign = require('../api/adCampaign/create')
const createAdCampaignSchema = require('../schema/adCampaign/create')
const updateAdCampaign = require('../api/adCampaign/update')
const updateAdCampaignSchema = require('../schema/adCampaign/update')
const activateAdCampaign = require('../api/adCampaign/activate')
const activateAdCampaignSchema = require('../schema/adCampaign/activate')

// Advertiser
const createAdvertiser = require('../api/advertiser/create')
const createAdvertiserSchema = require('../schema/advertiser/create')
const getAdvertiser = require('../api/advertiser/get')
const getAdvertiserSchema = require('../schema/advertiser/get')
const loginAdvertiser = require('../api/advertiser/login')
const loginAdvertiserSchema = require('../schema/advertiser/login')
const logoutAdvertiser = require('../api/advertiser/logout')
const updateAdvertiser = require('../api/advertiser/update')
const updateAdvertiserSchema = require('../schema/advertiser/update')

// Auth
const sendAuth = require('../api/auth/send')
const sendAuthSchema = require('../schema/auth/send')
const validateCaptcha = require('../api/auth/validate-captcha')
const validateCaptchaSchema = require('../schema/auth/validate-captcha')
const validateEmail = require('../api/auth/validate-email')
const validateEmailSchema = require('../schema/auth/validate-email')

// Maintainer
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

// Packages
const getPackages = require('../api/package/get')
const getPackagesSchema = require('../schema/package/get')
const refreshPackages = require('../api/package/refresh')
const updatePackages = require('../api/package/update')
const updatePackagesSchema = require('../schema/package/update')

// Session
const completeSession = require('../api/session/complete')
const completeSessionSchema = require('../schema/session/complete')

async function routes (fastify, opts, next) {
  // Ads
  fastify.post('/ad/create', { schema: createAdSchema }, (req, res) => createAd(req, res, fastify))
  fastify.get('/ad/get-all', { schema: getAllAdsSchema }, (req, res) => getAllAds(req, res, fastify))
  fastify.post('/ad/get', { schema: getAdSchema }, (req, res) => getAd(req, res, fastify))
  fastify.post('/ad/update', { schema: updateAdSchema }, (req, res) => updateAd(req, res, fastify))

  // Ad Campaigns
  fastify.post('/ad-campaign/create', { schema: createAdCampaignSchema }, (req, res) => createAdCampaign(req, res, fastify))
  fastify.post('/ad-campaign/update', { schema: updateAdCampaignSchema }, (req, res) => updateAdCampaign(req, res, fastify))
  fastify.post('/ad-campaign/activate', { schema: activateAdCampaignSchema }, (req, res) => activateAdCampaign(req, res, fastify))

  // Advertiser
  fastify.post('/advertiser/create', { schema: createAdvertiserSchema }, (req, res) => createAdvertiser(req, res, fastify))
  fastify.get('/advertiser/get', { schema: getAdvertiserSchema }, (req, res) => getAdvertiser(req, res, fastify))
  fastify.post('/advertiser/login', { schema: loginAdvertiserSchema }, (req, res) => loginAdvertiser(req, res, fastify))
  fastify.post('/advertiser/logout', (req, res) => logoutAdvertiser(req, res, fastify))
  fastify.post('/advertiser/update', { schema: updateAdvertiserSchema }, (req, res) => updateAdvertiser(req, res, fastify))

  // Auth
  fastify.post('/auth/send', { schema: sendAuthSchema }, (req, res) => sendAuth(req, res, fastify))
  fastify.post('/auth/validate-captcha', { schema: validateCaptchaSchema }, (req, res) => validateCaptcha(req, res, fastify))
  fastify.post('/auth/validate-email', { schema: validateEmailSchema }, (req, res) => validateEmail(req, res, fastify))

  // Maintainer
  fastify.post('/maintainer/login', { schema: loginMaintainerSchema }, (req, res) => loginMaintainer(req, res, fastify))
  fastify.post('/maintainer/logout', (req, res) => logoutMaintainer(req, res, fastify))
  fastify.post('/maintainer/register', { schema: registerMaintainerSchema }, (req, res) => registerMaintainer(req, res, fastify))
  fastify.get('/maintainer/revenue', { schema: maintainerRevenueSchema }, (req, res) => maintainerRevenue(req, res, fastify))
  fastify.post('/maintainer/update', { schema: updateMaintainerSchema }, (req, res) => updateMaintainer(req, res, fastify))
  fastify.post('/maintainer/verify', { schema: verifyMaintainerSchema }, (req, res) => verifyMaintainer(req, res, fastify))

  // Packages
  fastify.get('/package/get', { schema: getPackagesSchema }, (req, res) => getPackages(req, res, fastify))
  fastify.post('/package/refresh', (req, res) => refreshPackages(req, res, fastify))
  fastify.post('/package/update', { schema: updatePackagesSchema }, (req, res) => updatePackages(req, res, fastify))

  // Session
  fastify.post('/session/complete', { schema: completeSessionSchema }, (req, res) => completeSession(req, res, fastify))

  next()
}

module.exports = routes
