const { MongoMemoryServer } = require('mongodb-memory-server')
const { DynamoDBMemoryServer } = require('mocdoc')
const AWS = require('aws-sdk')
const App = require('../../app')
const { Config } = require('../../config')
const { Db } = require('../../db')
const { Auth } = require('../../auth')
const { Url } = require('../../url')
const { EthicalAds } = require('../../ethicalAds')
const mocks = require('./_mocks')

exports.before = async function (t, setup) {
  const mongo = new MongoMemoryServer()
  const mongoUri = await mongo.getUri()

  const config = new Config({
    env: {
      mongo_uri: mongoUri,
      url_host: 'api.flossbank.io',
      stripe_webhook_secret: 'whsec_QKhjn6Qhds46oInS0rBo7TYCjqHEug9D',
      ethical_ad_prefix: '5e3b04ba7ca8796b782ce6b9_01EJCGBVGC9830HR131WYRR12V_01EJCGBVGCY9R8M2ZP2PEMWH2X'
    }
  })

  const db = new Db({ config })
  await db.setup()

  const dynamo = new DynamoDBMemoryServer()
  const endpoint = await dynamo.getEndpoint()

  await createTables(endpoint, config)
  const docs = new AWS.DynamoDB.DocumentClient({ endpoint })
  const auth = new Auth({ docs, config })

  t.context.config = config
  if (typeof setup === 'function') {
    await setup({ db, auth })
  }

  await db.client.close()

  t.context.mongo = mongo
  t.context.dynamo = dynamo
}

exports.beforeEach = async function (t) {
  t.context.db = new Db({ config: t.context.config })
  await t.context.db.setup()

  const endpoint = await t.context.dynamo.getEndpoint()
  const docs = new AWS.DynamoDB.DocumentClient({ endpoint })

  t.context.ethicalAds = new EthicalAds({ docs, config: t.context.config })
  t.context.ethicalAds.got = mocks.EthicalAdsGot

  t.context.auth = new Auth({ docs, config: t.context.config })
  t.context.url = new Url({ docs, config: t.context.config })
  t.context.sqs = new mocks.Sqs()
  t.context.email = new mocks.Email()
  t.context.stripe = new mocks.Stripe({ config: t.context.config })
  t.context.registry = new mocks.Registry()
  t.context.github = new mocks.GitHub()
  t.context.app = await App({
    db: t.context.db,
    auth: t.context.auth,
    email: t.context.email,
    sqs: t.context.sqs,
    stripe: t.context.stripe,
    registry: t.context.registry,
    url: t.context.url,
    config: t.context.config,
    github: t.context.github,
    ethicalAds: t.context.ethicalAds,
    logger: false,
    csrf: false
  })
}

exports.afterEach = async function (t) {
  t.context.db.client.close()
  t.context.app.close()
}

exports.after = async function (t) {
  t.context.mongo.stop()
  t.context.dynamo.close()
}

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(() => resolve(), ms)
})

async function createTables (endpoint, config) {
  AWS.config.update({
    accessKeyId: 'accesskey',
    secretAccessKey: 'secretaccesskey',
    region: 'us-west-2'
  })

  const { Advertiser, Maintainer, User } = config.getAuthConfig()
  const urlConfig = config.getUrlConfig()
  const ethicalAdsConfig = config.getEthicalAdsConfig()
  const tables = [].concat(
    Advertiser.TableAttributes,
    Maintainer.TableAttributes,
    User.TableAttributes,
    urlConfig.TableAttributes,
    ethicalAdsConfig.TableAttributes
  )

  const dynamo = new AWS.DynamoDB({ endpoint })
  await Promise.all(tables.map(async ({ TableName, KeyAttribute }) => dynamo.createTable({
    TableName,
    AttributeDefinitions: [KeyAttribute],
    KeySchema: [{ KeyType: 'HASH', AttributeName: KeyAttribute.AttributeName }],
    BillingMode: 'PAY_PER_REQUEST'
  }).promise()))

  await Promise.all(tables.map(async ({ TableName }) => {
    let tableStatus
    while (tableStatus !== 'ACTIVE') {
      const description = await dynamo.describeTable({ TableName }).promise()
      tableStatus = description.Table.TableStatus
      await sleep(50)
    }
  }))
}
