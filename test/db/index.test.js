const test = require('ava')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { Db } = require('../../db')
const { Config } = require('../../config')

test.beforeEach(async (t) => {
  const mongo = new MongoMemoryServer()
  const mongoUri = await mongo.getUri()
  const config = new Config({ env: { mongo_uri: mongoUri } })

  const db = new Db({ config })
  await db.setup()

  t.context.db = db
})

test('constructor', (t) => {
  const config = {
    getMongoUri: () => {}
  }
  t.throws(() => new Db({ config }))
})

test('non-existant entities', async (t) => {
  const { db } = t.context
  t.is(await db.package.getByNameAndRegistry({ name: 'foo', registry: 'bar' }), null)
  t.is(await db.user.get({ userId: 'aaaaaaaaaaaaaaaaaaaaaaaa' }), null)
})
