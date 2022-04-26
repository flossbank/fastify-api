require('dotenv').config()

const App = require('./app')
const AWS = require('aws-sdk')
const StripeClient = require('stripe')
const { Config } = require('./config')
const { Db } = require('./db')
const { Auth } = require('./auth')
const { Sqs } = require('./sqs')
const { S3 } = require('./s3')
const { Email } = require('./email')
const { Registry } = require('./registry')
const { Url } = require('./url')
const { Stripe } = require('./stripe')
const { GitHub } = require('./github')
const { EthicalAds } = require('./ethicalAds')
const { DodS3GitHubPoller } = require('./dod-github-s3-poller')

;(async function () {
  const config = new Config({ env: process.env })

  // AWS resources
  AWS.config.update(config.getAwsConfig())
  const docs = new AWS.DynamoDB.DocumentClient()

  const db = new Db({ config })
  const auth = new Auth({ config, docs })
  const email = new Email({ ses: new AWS.SES() })
  const sqs = new Sqs({ config, sqs: new AWS.SQS() })
  const s3 = new S3({ s3: new AWS.S3(), config })
  const stripe = new Stripe({ stripe: StripeClient, config })
  const registry = new Registry()
  const url = new Url({ config, docs })
  const github = new GitHub({ config })
  const ethicalAds = new EthicalAds({ config, docs })
  const dodGithubS3Poller = new DodS3GitHubPoller({ db, config, s3, sqs })

  await db.setup()
  stripe.init()
  // TODO: figure out how to keep this alive, maybe a setTimeout here?
  dodGithubS3Poller.startPolling()

  const app = await App({
    db,
    auth,
    sqs,
    s3,
    email,
    stripe,
    registry,
    url,
    config,
    github,
    ethicalAds
  })
  try {
    await app.listen(8081)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
