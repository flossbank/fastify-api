const fastifyPlugin = require('fastify-plugin')
const { MongoClient, ObjectId } = require('mongodb')
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

exports.Db = Db

exports.dbPlugin = (db) => fastifyPlugin(async (fastify) => {
  fastify.decorate('db', db)
  fastify.decorate('ObjectId', ObjectId)
})
