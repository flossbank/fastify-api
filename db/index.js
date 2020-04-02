const fastifyPlugin = require('fastify-plugin')
const { MongoClient, ObjectId } = require('mongodb')
const { ulid } = require('ulid')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { config } = require('../config')
const Cleaner = require('../helpers/clean')
const { AD_NOT_CLEAN, AD_NOT_CLEAN_MSG } = require('../helpers/constants')

function Db (url) {
  const _url = url || config.getMongoUri()
  if (!_url) throw new Error('no mongo uri in environment')
  this.mongoClient = new MongoClient(_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
}

Db.prototype.connect = async function connect () {
  this.client = await this.mongoClient.connect()
  this.db = this.client.db('flossbank_db')
}

Db.prototype.getUserByEmail = async function getUserByEmail (email) {
  const user = await this.db.collection('users').findOne({ email })

  if (!user) return user

  const { _id: id, ...rest } = user
  return { id, ...rest }
}

Db.prototype.getUserById = async function getUserById (userId) {
  const user = await this.db.collection('users').findOne({ _id: ObjectId(userId) })

  if (!user) return user

  const { _id: id, ...rest } = user
  return { id, ...rest }
}

Db.prototype.createUser = async function createUser ({ email, apiKey, billingInfo }) {
  const { insertedId } = await this.db.collection('users').insertOne({ email, apiKey, billingInfo })
  return insertedId
}

Db.prototype.approveAdCampaign = async function approveAdCampaign (advertiserId, adCampaignId) {
  return this.db.collection('advertisers').updateOne(
    { _id: ObjectId(advertiserId), 'adCampaigns.id': adCampaignId },
    { $set: { 'adCampaigns.$.approved': true } }
  )
}

Db.prototype.betaSubscribe = async function betaSubscribe (email) {
  const token = crypto.randomBytes(32).toString('hex')
  await this.db.collection('betaSubscribers').insertOne({ email, token })
  return token
}

Db.prototype.betaUnsubscribe = async function betaUnsubscribe (token) {
  return this.db.collection('betaSubscribers').deleteOne({ token })
}

Db.prototype.getBetaSubscribers = async function getBetaSubscribers () {
  return this.db.collection('betaSubscribers').find().toArray()
}

Db.prototype.getAdBatch = async function getAdBatch () {
  // more complicated logic and/or caching can come later
  const ads = (await this.db.collection('advertisers').aggregate([
    // project advertiser documents as { _id: advertiserId, campaigns: <active campaigns> }
    {
      $project: {
        _id: '$_id',
        campaigns: {
          $filter: {
            input: '$adCampaigns',
            as: 'campaign',
            cond: {
              $eq: ['$$campaign.active', true]
            }
          }
        }
      }
    },
    // for each active campaign, project { _id: advertiserId, campaigns: {<the campaign>} }
    {
      $unwind: '$campaigns'
    },
    // project each resulting active campaign as { _id: advertiserId, ads: [<campaign ads>] }
    {
      $project: {
        _id: '$_id',
        campaignId: '$campaigns.id',
        ads: '$campaigns.ads'
      }
    },
    // for each ad in each active campaign, project { _id: advertiserId, ads: {<the ad>} }
    {
      $unwind: '$ads'
    },
    // randomly select 12 such documents
    {
      $sample: { size: 12 }
    }
  ]).toArray())

  // return ids in the form campaignId_adId for easier processing later
  return ads
    .reduce((acc, { ads: { id, title, body, url }, _id: advertiserId, campaignId }) => acc.concat({
      id: `${advertiserId}_${campaignId}_${id}`, title, body, url
    }), [])
}

Db.prototype.createAdvertiser = async function createAdvertiser (advertiser) {
  const advertiserWithDefaults = Object.assign({}, advertiser, {
    adCampaigns: [],
    verified: false,
    active: true,
    adDrafts: [],
    billingInfo: {},
    password: await bcrypt.hash(advertiser.password, 10)
  })
  const { insertedId } = await this.db.collection('advertisers').insertOne(advertiserWithDefaults)
  return insertedId
}

Db.prototype.updateAdvertiserCustomerId = async function updateAdvertiserCustomerId (id, customerId) {
  return this.db.collection('advertisers').updateOne({
    _id: ObjectId(id)
  }, {
    $set: { 'billingInfo.customerId': customerId }
  })
}

Db.prototype.updateAdvertiserHasCardInfo = async function updateAdvertiserHasCardInfo (id, hasCard, last4) {
  return this.db.collection('advertisers').updateOne({
    _id: ObjectId(id)
  }, {
    $set: { 'billingInfo.cardOnFile': hasCard, 'billingInfo.last4': last4 }
  })
}

Db.prototype.verifyAdvertiser = async function verifyAdvertiser (email) {
  return this.db.collection('advertisers').updateOne({
    email
  }, {
    $set: { verified: true }
  })
}

Db.prototype.getAdvertiser = async function getAdvertiser (advertiserId) {
  const advertiser = await this.db.collection('advertisers')
    .findOne({ _id: ObjectId(advertiserId) })

  if (!advertiser) return advertiser

  const { _id: id, ...rest } = advertiser
  delete rest.password
  return { id, ...rest }
}

Db.prototype.getAdvertiserByEmail = async function getAdvertiserByEmail (email) {
  const advertiser = await this.db.collection('advertisers')
    .findOne({ email })

  if (!advertiser) return advertiser

  const { _id: id, ...rest } = advertiser
  delete rest.password
  return { id, ...rest }
}

Db.prototype.authenticateAdvertiser = async function authenticateAdvertiser (email, password) {
  const foundAdvertiser = await this.db.collection('advertisers').findOne({ email })
  if (!foundAdvertiser) return null
  if (!foundAdvertiser.verified) return null
  const passMatch = await bcrypt.compare(password, foundAdvertiser.password)
  if (!passMatch) return null
  const { _id: id, ...rest } = foundAdvertiser
  delete rest.password
  return { id, ...rest }
}

Db.prototype.createAdDraft = async function createAdDraft (advertiserId, draft) {
  if (!Cleaner.isAdClean(draft)) {
    const e = new Error(AD_NOT_CLEAN_MSG)
    e.code = AD_NOT_CLEAN
    throw e
  }
  const adDraftWithDefaults = Object.assign({}, draft, { id: ulid() })
  await this.db.collection('advertisers').updateOne(
    { _id: ObjectId(advertiserId) },
    { $push: { adDrafts: adDraftWithDefaults } })
  return adDraftWithDefaults.id
}

Db.prototype.createAdCampaign = async function createAdCampaign (
  advertiserId,
  adCampaign,
  adIdsFromDrafts = [],
  keepDrafts = false) {
  const advertiser = await this.db.collection('advertisers').findOne({ _id: ObjectId(advertiserId) })

  // Construct default campaign
  const adCampaignWithDefaults = Object.assign({}, { ads: [] }, adCampaign, {
    id: ulid(),
    active: false,
    approved: false
  })

  // Check if the ads passed in are clean
  if (!adCampaignWithDefaults.ads.every(ad => Cleaner.isAdClean(ad))) {
    const e = new Error(AD_NOT_CLEAN_MSG)
    e.code = AD_NOT_CLEAN
    throw e
  }

  // assign ad defaults
  adCampaignWithDefaults.ads = adCampaignWithDefaults.ads.map((ad) => {
    return Object.assign({}, ad, { impressions: [], id: ulid() })
  })

  // construct the list of ads from adDrafts (if any) and append them to the campaigns ads
  if (adIdsFromDrafts.length) {
    const adsFromDrafts = []
    for (const draftId of adIdsFromDrafts) {
      const draft = advertiser.adDrafts.find(draft => draft.id === draftId)
      if (!draft) {
        continue
      }
      adsFromDrafts.push(Object.assign({}, draft, {
        id: ulid(),
        impressions: []
      }))
    }

    adCampaignWithDefaults.ads = adCampaignWithDefaults.ads.concat(adsFromDrafts)
  }

  if (!keepDrafts && adIdsFromDrafts.length) {
    await this.db.collection('advertisers').updateOne(
      { _id: ObjectId(advertiserId) },
      {
        $push: { adCampaigns: adCampaignWithDefaults },
        $pull: {
          adDrafts: {
            id: { $in: adIdsFromDrafts }
          }
        }
      })
  } else {
    await this.db.collection('advertisers').updateOne(
      { _id: ObjectId(advertiserId) },
      { $push: { adCampaigns: adCampaignWithDefaults } })
  }

  return adCampaignWithDefaults.id
}

Db.prototype.getAdCampaign = async function getAdCampaign (advertiserId, campaignId) {
  const advertiser = await this.db.collection('advertisers').findOne({
    _id: ObjectId(advertiserId)
  })

  if (!advertiser) return undefined
  return advertiser.adCampaigns.find(c => c.id === campaignId)
}

Db.prototype.getAdCampaignsForAdvertiser = async function getAdCampaignsForAdvertiser (advertiserId) {
  const advertiser = await this.db.collection('advertisers').findOne({ _id: ObjectId(advertiserId) })
  return advertiser.adCampaigns
}

Db.prototype.updateAdCampaign = async function updateAdCampaign (
  advertiserId,
  updatedAdCampaign,
  adIdsFromDrafts = [],
  keepDrafts = false) {
  const { id: adCampaignId } = updatedAdCampaign
  const advertiser = await this.db.collection('advertisers').findOne({ _id: ObjectId(advertiserId) })
  const previousCampaign = advertiser.adCampaigns.find((camp) => camp.id === adCampaignId)
  // Grab the existing ads id's
  const previousAdsMap = previousCampaign.ads.reduce((map, ad) => {
    map.set(ad.id, ad)
    return map
  }, new Map())

  // Check if the ads passed in are clean
  if (!updatedAdCampaign.ads.every(ad => Cleaner.isAdClean(ad))) {
    const e = new Error(AD_NOT_CLEAN_MSG)
    e.code = AD_NOT_CLEAN
    throw e
  }

  // Go through all ads to be added and if they're new, initialize them
  const adsToAdd = updatedAdCampaign.ads.map((ad) => {
    // If it's an existing ad, don't give fresh ID + impressions
    if (previousAdsMap.has(ad.id)) {
      return previousAdsMap.get(ad.id)
    }
    return Object.assign({}, ad, {
      id: ulid(),
      impressions: []
    })
  })

  // Create updated campaign and assign defaults to impression value and approved back to false
  const updatedCampaign = Object.assign({}, previousCampaign, updatedAdCampaign, {
    approved: false
  })

  // construct the list of ads from adDrafts (if any) and append them to the campaigns ads
  if (adIdsFromDrafts.length) {
    const adsFromDrafts = []
    for (const draftId of adIdsFromDrafts) {
      const draft = advertiser.adDrafts.find(draft => draft.id === draftId)
      adsFromDrafts.push(Object.assign({}, draft, {
        id: ulid(),
        impressions: []
      }))
    }

    updatedCampaign.ads = adsToAdd.concat(adsFromDrafts)
  }

  updatedCampaign.active = false

  if (!keepDrafts && adIdsFromDrafts.length) {
    return this.db.collection('advertisers').updateOne(
      { _id: ObjectId(advertiserId), 'adCampaigns.id': adCampaignId },
      {
        $set: { 'adCampaigns.$': updatedCampaign },
        $pull: {
          adDrafts: {
            id: { $in: adIdsFromDrafts }
          }
        }
      })
  } else {
    return this.db.collection('advertisers').updateOne(
      { _id: ObjectId(advertiserId), 'adCampaigns.id': adCampaignId },
      { $set: { 'adCampaigns.$': updatedCampaign } })
  }
}

Db.prototype.activateAdCampaign = async function activateAdCampaign (advertiserId, campaignId) {
  await this.db.collection('advertisers').updateOne({
    _id: ObjectId(advertiserId),
    'adCampaigns.id': campaignId
  }, {
    $set: { 'adCampaigns.$.active': true }
  })
}

Db.prototype.getOwnedPackages = async function getOwnedPackages (maintainerId) {
  const pkgs = await this.db.collection('packages').find({
    owner: maintainerId
  }).toArray()

  return pkgs.map(({ _id: id, ...rest }) => ({ id, ...rest }))
}

Db.prototype.createPackage = async function createPackage (pkg) {
  const { insertedId } = await this.db.collection('packages').insertOne(pkg)
  return insertedId
}

Db.prototype.getPackage = async function getPackage (packageId) {
  const pkg = await this.db.collection('packages').findOne({
    _id: ObjectId(packageId)
  })

  if (!pkg) return pkg

  const { _id: id, ...rest } = pkg
  return { id, ...rest }
}

Db.prototype.getPackageByName = async function getPackageByName (name, registry) {
  const pkg = await this.db.collection('packages').findOne({
    name, registry
  })

  if (!pkg) return pkg

  const { _id: id, ...rest } = pkg
  return { id, ...rest }
}

Db.prototype.updatePackage = async function updatePackage (packageId, { maintainers, owner }) {
  return this.db.collection('packages').updateOne({
    _id: ObjectId(packageId)
  }, {
    $set: { maintainers, owner }
  })
}

Db.prototype.refreshPackageOwnership = async function refreshPackageOwnership (packages, registry, maintainerId) {
  const existingPackages = await this.db.collection('packages').find({
    $or: [
      { name: { $in: packages } },
      { owner: maintainerId }
    ],
    registry
  }).toArray()

  const packageDeletions = existingPackages
    .filter(pkg => !packages.includes(pkg.name))
    .map(pkg => ({
      criteria: { name: pkg.name, registry },
      update: {
        $set: { owner: null },
        $pull: { maintainers: { maintainerId } }
      }
    }))
  const packageInsertions = packages
    .filter(pkg => !existingPackages.some((ePkg) => ePkg.name === pkg))
    .map(pkg => ({
      name: pkg,
      registry,
      owner: maintainerId,
      maintainers: [{ maintainerId, revenuePercent: 100 }]
    }))
  const packageUpdates = existingPackages
    .filter(pkg => pkg.owner !== maintainerId)
    .map(pkg => {
      const alreadyMaintains = pkg.maintainers.some(maintainer => maintainer.maintainerId === maintainerId)
      return {
        criteria: { name: pkg.name, registry },
        update: {
          $set: {
            owner: maintainerId,
            maintainers: alreadyMaintains
              ? pkg.maintainers
              : pkg.maintainers.concat([{ maintainerId, revenuePercent: 0 }])
          }
        }
      }
    })
  const bulkPackages = this.db.collection('packages').initializeUnorderedBulkOp()

  for (const insertion of packageInsertions) {
    bulkPackages.insert(insertion)
  }
  for (const update of packageUpdates) {
    bulkPackages.find(update.criteria).update(update.update)
  }
  for (const deletion of packageDeletions) {
    bulkPackages.find(deletion.criteria).update(deletion.update)
  }

  return bulkPackages.execute()
}

Db.prototype.getRevenue = async function getRevenue (maintainerId) {
  const packages = await this.db.collection('packages').find({
    maintainers: { $elemMatch: { maintainerId } }
  }).toArray()
  return packages.reduce((totalRevenue, pkg) => {
    const { revenuePercent } = pkg.maintainers.find((maintainer) => maintainer.maintainerId === maintainerId)
    return totalRevenue + (pkg.totalRevenue * (revenuePercent / 100))
  }, 0)
}

Db.prototype.createMaintainer = async function createMaintainer (maintainer) {
  const maintainerWithDefaults = Object.assign({}, maintainer, {
    verified: false,
    active: true,
    password: await bcrypt.hash(maintainer.password, 10)
  })
  const { insertedId } = await this.db.collection('maintainers').insertOne(maintainerWithDefaults)
  return insertedId
}

Db.prototype.getMaintainer = async function getMaintainer (maintainerId) {
  const maintainer = await this.db.collection('maintainers')
    .findOne({ _id: ObjectId(maintainerId) })

  if (!maintainer) return maintainer

  const { _id: id, ...rest } = maintainer
  delete rest.password
  return { id, ...rest }
}

Db.prototype.getMaintainerByEmail = async function getMaintainerByEmail (email) {
  const maintainer = await this.db.collection('maintainers')
    .findOne({ email })

  if (!maintainer) return maintainer

  const { _id: id, ...rest } = maintainer
  delete rest.password
  return { id, ...rest }
}

Db.prototype.authenticateMaintainer = async function authenticateMaintainer (email, password) {
  const foundMaintainer = await this.db.collection('maintainers').findOne({ email })
  if (!foundMaintainer) return null
  if (!foundMaintainer.verified) return null
  const passMatch = await bcrypt.compare(password, foundMaintainer.password)
  if (!passMatch) return null
  const { _id: id, ...rest } = foundMaintainer
  delete rest.password
  return { id, ...rest }
}

Db.prototype.verifyMaintainer = async function verifyMaintainer (email) {
  return this.db.collection('maintainers').updateOne({
    email
  }, {
    $set: { verified: true }
  })
}

Db.prototype.updateMaintainerPayoutInfo = async function updateMaintainerPayoutInfo (id, payoutInfo) {
  return this.db.collection('maintainers').updateOne({
    _id: ObjectId(id)
  }, {
    $set: { payoutInfo }
  })
}

exports.Db = Db

exports.dbPlugin = (db) => fastifyPlugin(async (fastify) => {
  fastify.decorate('db', db)
  fastify.decorate('ObjectId', ObjectId)
})
