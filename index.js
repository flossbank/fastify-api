// require('dotenv').config()

// const App = require('./app')
// const AWS = require('aws-sdk')
// const StripeClient = require('stripe')
// const { Config } = require('./config')
// const { Db } = require('./db')
// const { Auth } = require('./auth')
// const { Sqs } = require('./sqs')
// const { S3 } = require('./s3')
// const { Email } = require('./email')
// const { Registry } = require('./registry')
// const { Url } = require('./url')
// const { Stripe } = require('./stripe')
// const { GitHub } = require('./github')
// const { EthicalAds } = require('./ethicalAds')
// 
// ;(async function () {
//   const config = new Config({ env: process.env })
// 
//   // AWS resources
//   AWS.config.update(config.getAwsConfig())
//   const docs = new AWS.DynamoDB.DocumentClient()
// 
//   const db = new Db({ config })
//   const auth = new Auth({ config, docs })
//   const email = new Email({ ses: new AWS.SES() })
//   const sqs = new Sqs({ config, sqs: new AWS.SQS() })
//   const s3 = new S3({ s3: new AWS.S3(), config })
//   const stripe = new Stripe({ stripe: StripeClient, config })
//   const registry = new Registry()
//   const url = new Url({ config, docs })
//   const github = new GitHub({ config })
//   const ethicalAds = new EthicalAds({ config, docs })
// 
//   await db.setup()
//   stripe.init()
// 
//   const app = await App({
//     db,
//     auth,
//     sqs,
//     s3,
//     email,
//     stripe,
//     registry,
//     url,
//     config,
//     github,
//     ethicalAds
//   })
//   try {
//     await app.listen(8081)
//   } catch (err) {
//     console.error(err)
//     process.exit(1)
//   }
// })()

const server = require('fastify')()
server.register(require('fastify-helmet'))
server.register(require('fastify-cookie'))
server.register(async (fastify, opts, done) => {
  fastify.get('/health', { logLevel: 'error' }, (req, res) => res.send({ success: true }))
  fastify.post('/health', { logLevel: 'error' }, (req, res) => res.send({ success: true }))
  fastify.post('/session/start', (req, res) => {
    res.send({
      ads: [{
        name: 'Flossbank Shutdown',
        title: 'Flossbank has shutdown',
        body: 'Run "flossbank uninstall" to remove the app!',
        url: 'https://medium.com/@joelwass/the-flossbank-attempt-de9d8ecc1dcf'
      }],
      sessionId: 'bogus'
    })
  })

  fastify.post('/session/complete', (req, res) => {
    res.status(200)
    res.send({ success: true })
  })

  done()
})

server.listen(8081)
