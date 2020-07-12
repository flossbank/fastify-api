const Ajv = require('ajv')
const Fastify = require('fastify')
const routes = require('./routes')
const stripeRoutes = require('./routes/stripe')
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

  fastify.register(stripeRoutes)

  const allowedOrigins = [
    'https://flossbank.com',
    'https://advertiser.flossbank.com',
    'https://maintainer.flossbank.com',
    'https://user.flossbank.com'
  ]
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push(
      'http://localhost:3000',
      /\.flossbank\.now\.sh$/
    )
  }

  fastify.register(require('fastify-cors'), {
    origin: allowedOrigins,
    methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
    credentials: true
  })

  fastify.register(routes, { csrf })

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
