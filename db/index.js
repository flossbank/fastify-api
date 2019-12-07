const fastifyPlugin = require('fastify-plugin')
const { MongoClient, ObjectId } = require('mongodb')
const bcrypt = require('bcrypt')
const config = require('../config')

function Db () {
  const url = config.getMongoUri()
  if (!url) throw new Error('no mongo uri in environment')
  this.mongoClient = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
}

Db.prototype.connect = async function connect () {
  this.client = await this.mongoClient.connect()
  this.db = this.client.db('flossbank_db')
}

Db.prototype.getClient = function getClient () {
  return this.client
}

Db.prototype.getDb = function getDb () {
  return this.db
}

/** Ads */
Db.prototype.getAdBatch = async function getAdBatch () {
  const ads = await this.db.collection('ads').find({
    active: true, approved: true
  }).limit(12).toArray()

  return ads.map(
    ({ _id, content: { title, body, url } }) => ({ id: _id, title, body, url })
  )
}

Db.prototype.getAdsByIds = async function getAdsByIds (ids) {
  if (!ids || !ids.length) return []
  return this.db.collection('ads').find({
    _id: { $in: ids.map(ObjectId) }
  }).toArray()
}

Db.prototype.getAdsByAdvertiser = async function getAdsByAdvertiser (advertiserId) {
  const ads = await this.db.collection('ads').find({
    advertiserId
  }).toArray()

  return ads.map(({ _id: id, name, content, advertiserId, active, approved }) => ({
    id, name, content, advertiserId, active, approved
  }))
}

Db.prototype.createAd = async function createAd (ad) {
  const { insertedId } = await this.db.collection('ads').insertOne(ad)
  return insertedId
}

Db.prototype.updateAd = async function updateAd (id, ad) {
  return this.db.collection('ads').updateOne({
    _id: ObjectId(id)
  }, {
    $set: ad
  })
}

Db.prototype.createAdvertiser = async function createAdvertiser (advertiser) {
  advertiser.password = await bcrypt.hash(advertiser.password, 10)
  const { insertedId } = await this.db.collection('advertisers').insertOne(advertiser)
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
  const { _id: id, ...rest } = await this.db.collection('advertisers')
    .findOne({ _id: ObjectId(advertiserId) })
  delete rest.password
  return { id, ...rest }
}

Db.prototype.authenticateAdvertiser = async function authenticateAdvertiser (email, password) {
  const foundAdvertiser = await this.db.collection('advertisers').findOne({ email })
  if (!foundAdvertiser) return { success: false, message: 'Login failed; Invalid user ID or password' }
  if (!foundAdvertiser.verified) return { success: false, message: 'Login failed; Invalid user ID or password' }
  const passMatch = await bcrypt.compare(password, foundAdvertiser.password)
  if (!passMatch) return { success: false, message: 'Login failed; Invalid user ID or password' }
  return { success: true }
}

Db.prototype.createAdCampaign = async function createAdCampaign (adCampaign) {
  const adCampaignWithDefaults = Object.assign({}, adCampaign, {
    active: false,
    spend: 0
  })
  const { insertedId } = await this.db.collection('adCampaigns').insertOne(adCampaignWithDefaults)
  return insertedId
}

Db.prototype.getAdCampaign = async function getAdCampaign (campaignId) {
  const { _id: id, ...rest } = this.db.collection('adCampaigns').findOne({ _id: ObjectId(campaignId) })
  return { id, ...rest }
}

Db.prototype.getAdCampaignsForAdvertiser = async function getAdCampaignsForAdvertiser (advertiserId) {
  const adCampaigns = this.db.collection('adCampaigns').find({ advertiserId }).toArray()
  return adCampaigns.map(({ _id: id, ...rest }) => ({ id, ...rest }))
}

Db.prototype.updateAdCampaign = async function updateAdCampaign (id, adCampaign) {
  return this.db.collection('adCampaigns').updateOne({
    _id: ObjectId(id)
  }, {
    $set: adCampaign
  })
}

Db.prototype.activateAdCampaign = async function activateAdCampaign (id) {
  const campaign = await this.getAdCampaign(id)
  const session = this.client.startSession()
  try {
    await session.withTransaction(async () => {
      await this.db.collection('ads').updateMany({
        _id: { $in: campaign.ads.map(ObjectId) }
      }, {
        $set: { active: true }
      }, { session })
      await this.db.collection('adCampaigns').updateOne({
        _id: ObjectId(id)
      }, {
        $set: { active: true }
      }, { session })
    })
  } finally {
    await session.endSession()
  }
}

Db.prototype.getOwnedPackages = async function getOwnedPackages (maintainerId) {
  return this.db.collection('packages').find({
    owner: maintainerId
  }).toArray().map(({ _id: id, ...rest }) => ({ id, ...rest }))
}

Db.prototype.getPackage = async function getPackage (packageId) {
  return this.db.collection('packages').findOne({
    _id: ObjectId(packageId)
  })
}

Db.prototype.updatePackage = async function updatePackage (packageId, pkg) {
  return this.db.collection('packages').updateOne({
    _id: ObjectId(packageId)
  }, {
    $set: { package: pkg }
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
      update: { $set: { owner: undefined } }
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
  const packages = this.db.collection('packages').find({
    maintainers: { $elemMatch: { maintainerId } }
  }).toArray()
  return packages.reduce((totalRevenue, pkg) => {
    const { revenuePercent } = pkg.maintainers.find((maintainer) => maintainer.maintainerId === maintainerId)
    return totalRevenue + (pkg.totalRevenue * (revenuePercent / 100))
  }, 0)
}

Db.prototype.createMaintainer = async function createMaintainer (maintainer) {
  maintainer.password = await bcrypt.hash(maintainer.password, 10)
  maintainer.verified = false
  const { insertedId } = await this.db.collection('maintainers').insertOne(maintainer)
  return insertedId
}

Db.prototype.authenticateMaintainer = async function authenticateMaintainer (email, password) {
  const foundMaintainer = await this.db.collection('maintainers').findOne({ email })
  if (!foundMaintainer) return { success: false, message: 'Login failed; Invalid user ID or password' }
  if (!foundMaintainer.verified) return { success: false, message: 'Login failed; Invalid user ID or password' }
  const passMatch = await bcrypt.compare(password, foundMaintainer.password)
  if (!passMatch) return { success: false, message: 'Login failed; Invalid user ID or password' }
  return { success: true }
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

Db.prototype.getMaintainer = async function getMaintainer (maintainerId) {
  const { _id: id, ...rest } = await this.db.collection('maintainers')
    .findOne({ _id: ObjectId(maintainerId) })
  delete rest.password
  return { id, ...rest }
}

exports.Db = Db

exports.dbPlugin = (db) => fastifyPlugin(async (fastify) => {
  fastify.decorate('db', db)
  fastify.decorate('ObjectId', ObjectId)
})
