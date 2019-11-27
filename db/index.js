const fastifyPlugin = require('fastify-plugin')
const { MongoClient, ObjectID } = require('mongodb')
const config = require('../config')

async function Db (fastify) {
  const url = config.getMongoUri()
  if (!url) throw new Error('no mongo uri in environment')
  const mongoClient = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const client = await mongoClient.connect()
  const db = client.db('flossbank_db')
  fastify.decorate('mongo', db)
  fastify.decorate('mongoClient', client)
  fastify.decorate('mongoObjectID', ObjectID)
}

module.exports = fastifyPlugin(Db)
