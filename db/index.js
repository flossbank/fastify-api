const fastifyPlugin = require('fastify-plugin')
const { MongoClient, ObjectId } = require('mongodb')
const { ulid } = require('ulid')
const { compare } = require('js-deep-equals')
const bcrypt = require('bcrypt')
const config = require('../config')

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

Db.prototype.approveAd = async function approveAd (adCampaignId, adId) {
  return this.db.collection('adCampaigns').updateOne({
    _id: ObjectId(adCampaignId), 'ads.id': adId
  }, {
    $set: { 'ads.$.approved': true }
  })
}

Db.prototype.getAdBatch = async function getAdBatch () {
  // more complicated logic and/or caching can come later
  const ads = (await this.db.collection('adCampaigns').aggregate([
    { $match: { active: true } }, // find active campaigns
    { $project: { _id: '$_id', ads: true } }, // pick just their ads fields
    { $unwind: '$ads' }, // unwind ads into a single array
    { $sample: { size: 12 } } // return a random sampling of size 12
  ]).toArray())

  // return ids in the form campaignId_adId for easier processing later
  return ads
    .reduce((acc, { ads: { id, title, body, url }, _id: campaignId }) => acc.concat({
      id: campaignId + '_' + id, title, body, url
    }), [])
}

Db.prototype.createAdvertiser = async function createAdvertiser (advertiser) {
  const advertiserWithDefaults = Object.assign({}, advertiser, {
    adCampaigns: [],
    verified: false,
    active: true,
    password: await bcrypt.hash(advertiser.password, 10)
  })
  const { insertedId } = await this.db.collection('advertisers').insertOne(advertiserWithDefaults)
  return insertedId
}

Db.prototype.updateAdvertiser = async function updateAdvertiser (id, advertiser) {
  return this.db.collection('advertisers').updateOne({
    _id: ObjectId(id)
  }, {
    $set: advertiser
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

Db.prototype.findAdvertiser = async function findAdvertiser (email) {
  const advertiser = await this.db.collection('advertisers').findOne({ email })

  if (!advertiser) return advertiser

  const { _id: id, ...rest } = advertiser
  delete rest.password
  return { id, ...rest }
}

Db.prototype.authenticateAdvertiser = async function authenticateAdvertiser (email, password) {
  const foundAdvertiser = await this.db.collection('advertisers').findOne({ email })
  if (!foundAdvertiser) return { success: false, message: 'Login failed; Invalid user ID or password' }
  if (!foundAdvertiser.verified) return { success: false, message: 'Login failed; Invalid user ID or password' }
  const passMatch = await bcrypt.compare(password, foundAdvertiser.password)
  if (!passMatch) return { success: false, message: 'Login failed; Invalid user ID or password' }
  const { _id: id, ...rest } = foundAdvertiser
  delete rest.password
  return { success: true, advertiser: { id, ...rest } }
}

Db.prototype.createAdCampaign = async function createAdCampaign (adCampaign) {
  const adCampaignWithDefaults = Object.assign({}, adCampaign, {
    impressionValue: adCampaign.cpm / 1000,
    active: false,
    spend: 0
  })
  adCampaignWithDefaults.ads = adCampaign.ads.map(ad => {
    return Object.assign({}, ad, { id: ulid(), approved: false })
  })
  const { insertedId } = await this.db.collection('adCampaigns').insertOne(adCampaignWithDefaults)
  return insertedId
}

Db.prototype.getAdCampaign = async function getAdCampaign (campaignId) {
  const campaign = await this.db.collection('adCampaigns').findOne({
    _id: ObjectId(campaignId)
  })

  if (!campaign) return campaign

  const { _id: id, ...rest } = campaign
  return { id, ...rest }
}

Db.prototype.getAdCampaignsForAdvertiser = async function getAdCampaignsForAdvertiser (advertiserId) {
  const adCampaigns = await this.db.collection('adCampaigns').find({ advertiserId }).toArray()
  return adCampaigns.map(({ _id: id, ...rest }) => ({ id, ...rest }))
}

Db.prototype.updateAdCampaign = async function updateAdCampaign (id, adCampaign) {
  const campaign = await this.getAdCampaign(id)
  // Set all modified as well as new ads approved key to "false"
  const previousAds = campaign.ads.reduce((map, ad) => {
    map.set(ad.id, ad)
    return map
  }, new Map())

  const updatedCampaign = Object.assign({}, adCampaign, {
    impressionValue: adCampaign.cpm / 1000
  })

  updatedCampaign.ads = adCampaign.ads.map((ad) => {
    const isExistingAd = previousAds.has(ad.id)
    const adWasApproved = isExistingAd && previousAds.get(ad.id).approved

    if (adWasApproved && compare(ad, previousAds.get(ad.id))) {
      return ad
    }

    return Object.assign({ id: ulid() }, ad, { approved: false })
  })

  // All ad campaigns that are updated should immediately be set to inactive
  updatedCampaign.active = false

  return this.db.collection('adCampaigns').updateOne({
    _id: ObjectId(id)
  }, {
    $set: updatedCampaign
  })
}

Db.prototype.activateAdCampaign = async function activateAdCampaign (id) {
  await this.db.collection('adCampaigns').updateOne({
    _id: ObjectId(id)
  }, {
    $set: { active: true }
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

Db.prototype.updatePackage = async function updatePackage (packageId, pkg) {
  return this.db.collection('packages').updateOne({
    _id: ObjectId(packageId)
  }, {
    $set: pkg
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

Db.prototype.findMaintainer = async function findMaintainer (email) {
  const maintainer = await this.db.collection('maintainers').findOne({ email })

  if (!maintainer) return maintainer

  const { _id: id, ...rest } = maintainer
  delete rest.password
  return { id, ...rest }
}

Db.prototype.authenticateMaintainer = async function authenticateMaintainer (email, password) {
  const foundMaintainer = await this.db.collection('maintainers').findOne({ email })
  if (!foundMaintainer) return { success: false, message: 'Login failed; Invalid user ID or password' }
  if (!foundMaintainer.verified) return { success: false, message: 'Login failed; Invalid user ID or password' }
  const passMatch = await bcrypt.compare(password, foundMaintainer.password)
  if (!passMatch) return { success: false, message: 'Login failed; Invalid user ID or password' }
  const { _id: id, ...rest } = foundMaintainer
  delete rest.password
  return { success: true, maintainer: { id, ...rest } }
}

Db.prototype.verifyMaintainer = async function verifyMaintainer (email) {
  return this.db.collection('maintainers').updateOne({
    email
  }, {
    $set: { verified: true }
  })
}

Db.prototype.updateMaintainer = async function updateMaintainer (id, maintainer) {
  return this.db.collection('maintainers').updateOne({
    _id: ObjectId(id)
  }, {
    $set: maintainer
  })
}

exports.Db = Db

exports.dbPlugin = (db) => fastifyPlugin(async (fastify) => {
  fastify.decorate('db', db)
  fastify.decorate('ObjectId', ObjectId)
})
