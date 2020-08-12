require('dotenv').config()

const App = require('./app')
const AWS = require('aws-sdk')
const StripeClient = require('stripe')
const { Config } = require('./config')
const { Db } = require('./db')
const { Auth } = require('./auth')
const { Sqs } = require('./sqs')
const { Email } = require('./email')
const { Registry } = require('./registry')
const { Url } = require('./url')
const { Stripe } = require('./stripe')
const { GitHub } = require('./github')

;(async function () {
  const config = new Config({ env: process.env })

  // AWS resources
  AWS.config.update(config.getAwsConfig())
  const docs = new AWS.DynamoDB.DocumentClient()

  const db = new Db({ config })
  const auth = new Auth({ config, docs })
  const email = new Email({ ses: new AWS.SES() })
  const sqs = new Sqs({ config, sqs: new AWS.SQS() })
  const stripe = new Stripe({ stripe: StripeClient, config })
  const registry = new Registry()
  const url = new Url({ config, docs })
  const github = new GitHub({ config })

  await db.setup()
  stripe.init()

  const app = await App({ db, auth, sqs, email, stripe, registry, url, config, github })
  try {
    await app.listen(8081)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
