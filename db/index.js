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
  return this.db.collection('ads').find({
    advertiserId
  }).toArray().map(({ _id: id, name, content, advertiserId, active, approved }) => ({
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

Db.prototype.getAdCampaign = async function getAdCampaign (id) {
  return this.db.collection('adCampaigns').findOne({ _id: ObjectId(id) })
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

exports.Db = Db

exports.dbPlugin = (db) => fastifyPlugin(async (fastify) => {
  fastify.decorate('db', db)
  fastify.decorate('ObjectId', ObjectId)
})
