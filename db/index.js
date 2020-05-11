const fastifyPlugin = require('fastify-plugin')
const { MongoClient, ObjectId } = require('mongodb')

const UserDb = require('./user')
const AdvertiserDb = require('./advertiser')
const MaintainerDb = require('./maintainer')
const PackageDb = require('./package')
const AdDb = require('./ad')
const SubscribeDb = require('./subscribe')

class Db {
  constructor ({ config }) {
    const url = config.getMongoUri()
    if (!url) throw new Error('no mongo uri in environment')
    this.mongoClient = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
  }

  async connect () {
    this.client = await this.mongoClient.connect()
    this.db = this.client.db('flossbank_db')

    this.user = new UserDb({ db: this.db })
    this.advertiser = new AdvertiserDb({ db: this.db })
    this.ad = new AdDb({ db: this.db })
    this.maintainer = new MaintainerDb({ db: this.db })
    this.subscribe = new SubscribeDb({ db: this.db })
    this.package = new PackageDb({ db: this.db })
  }
}

exports.Db = Db

exports.dbPlugin = (db) => fastifyPlugin(async (fastify) => {
  fastify.decorate('db', db)
  fastify.decorate('ObjectId', ObjectId)
})
