const Ajv = require('ajv')
const Fastify = require('fastify')
const routes = require('./routes')
const { authPlugin } = require('./auth')
const { dbPlugin } = require('./db')
const { sqsPlugin } = require('./sqs')
const { configPlugin } = require('./config')
const { stripePlugin } = require('./stripe')
const { registryPlugin } = require('./registry')
const { emailPlugin } = require('./email')
const { urlPlugin } = require('./url')

module.exports = async function buildFastify (deps) {
  const { db, auth, sqs, email, registry, stripe, url, config, logger = true, csrf = true } = deps
  const fastify = Fastify({ logger })
  // Create custom ajv schema declaration to remove _all_ additional fields by default
  const ajv = new Ajv({
    removeAdditional: 'all',
    useDefaults: true,
    coerceTypes: true,
    allErrors: true,
    nullable: true
  })
  fastify.setSchemaCompiler(function (schema) {
    return ajv.compile(schema)
  })
  fastify.register(require('fastify-helmet'))
  fastify.register(require('fastify-cookie'))

  const allowedOrigins = [
    'https://flossbank.com',
    'https://advertiser.flossbank.com',
    'https://maintainer.flossbank.com',
    'https://verification.flossbank.com'
  ]
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000')
  }

  fastify.register(require('fastify-cors'), {
    origin: allowedOrigins,
    methods: ['GET', 'OPTIONS', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
    credentials: true
  })

  if (csrf) {
    fastify.use((req, res, next) => {
      if (req.method !== 'POST') {
        return next()
      }
      // Have to exempt stripe webhooks from csrf protection
      const headerInvalid = req.headers['x-requested-with'] !== 'XmlHttpRequest'
      const stripeWebhookEvent = req.url === '/stripe/webhook/event'
      if (headerInvalid && !stripeWebhookEvent) {
        res.writeHead(403)
        return res.end()
      }
      return next()
    })
  }

  fastify.register(routes)

  fastify.register(dbPlugin(db))
  fastify.register(authPlugin(auth))
  fastify.register(emailPlugin(email))
  fastify.register(stripePlugin(stripe))
  fastify.register(sqsPlugin(sqs))
  fastify.register(registryPlugin(registry))
  fastify.register(urlPlugin(url))
  fastify.register(configPlugin(config))

  return fastify
}
