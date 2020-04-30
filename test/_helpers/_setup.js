const { MongoMemoryServer } = require('mongodb-memory-server')
const { DynamoDBMemoryServer } = require('mocdoc')
const AWS = require('aws-sdk')
const App = require('../../app')
const { Db } = require('../../db')
const { Auth } = require('../../auth')
const { Url } = require('../../url')
const mocks = require('./_mocks')

exports.before = async function (t, setup) {
  const mongo = new MongoMemoryServer()
  const mongoUri = await mongo.getConnectionString()
  const db = new Db({
    config: {
      getMongoUri: () => mongoUri
    }
  })
  await db.connect()

  const dynamo = new DynamoDBMemoryServer()
  const endpoint = await dynamo.getEndpoint()

  await createTables(endpoint)

  const docs = new AWS.DynamoDB.DocumentClient({ endpoint })
  const auth = new Auth({ docs, config: { getRecaptchaSecret: () => 'abc' } })

  if (typeof setup === 'function') {
    await setup({ db, auth })
  }

  await db.client.close()

  t.context.mongo = mongo
  t.context.dynamo = dynamo
}

exports.beforeEach = async function (t) {
  const mongoUri = await t.context.mongo.getConnectionString()
  t.context.db = new Db({
    config: {
      getMongoUri: () => mongoUri
    }
  })
  await t.context.db.connect()

  const endpoint = await t.context.dynamo.getEndpoint()
  const docs = new AWS.DynamoDB.DocumentClient({ endpoint })

  t.context.auth = new Auth({ docs, config: { getRecaptchaSecret: () => 'abc' } })
  t.context.url = new Url({ docs, config: { getUrlHost: () => 'api.flossbank.io' } })
  t.context.sqs = new mocks.Sqs()
  t.context.email = new mocks.Email()
  t.context.stripe = new mocks.Stripe()
  t.context.registry = new mocks.Registry()
  t.context.app = await App({
    db: t.context.db,
    auth: t.context.auth,
    email: t.context.email,
    sqs: t.context.sqs,
    stripe: t.context.stripe,
    registry: t.context.registry,
    url: t.context.url,
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

async function createTables (endpoint) {
  AWS.config.update({
    accessKeyId: 'accesskey',
    secretAccessKey: 'secretaccesskey',
    region: 'us-west-2'
  })

  const dynamo = new AWS.DynamoDB({ endpoint })
  const tables = [
    { TableName: 'AdvertiserWebSessions', KeyAttribute: { AttributeName: 'sessionId', AttributeType: 'S' } },
    { TableName: 'AdvertiserRegistrationTokens', KeyAttribute: { AttributeName: 'email', AttributeType: 'S' } },
    { TableName: 'flossbank_api_keys', KeyAttribute: { AttributeName: 'key', AttributeType: 'S' } },
    { TableName: 'MaintainerWebSessions', KeyAttribute: { AttributeName: 'sessionId', AttributeType: 'S' } },
    { TableName: 'MaintainerRegistrationTokens', KeyAttribute: { AttributeName: 'email', AttributeType: 'S' } },
    { TableName: 'UserApiKeys', KeyAttribute: { AttributeName: 'apiKey', AttributeType: 'S' } },
    { TableName: 'UserWebSessions', KeyAttribute: { AttributeName: 'sessionId', AttributeType: 'S' } },
    { TableName: 'UserRegistrationTokens', KeyAttribute: { AttributeName: 'email', AttributeType: 'S' } },
    { TableName: 'UserLoginTokens', KeyAttribute: { AttributeName: 'token', AttributeType: 'S' } },
    { TableName: 'flossbank_ad_session', KeyAttribute: { AttributeName: 'sessionId', AttributeType: 'S' } },
    { TableName: 'flossbank_urls', KeyAttribute: { AttributeName: 'urlId', AttributeType: 'S' } }
  ]
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
