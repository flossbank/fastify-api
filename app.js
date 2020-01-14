const Ajv = require('ajv')
const Fastify = require('fastify')
const routes = require('./routes')
const { authPlugin } = require('./auth')
const { dbPlugin } = require('./db')
const { sqsPlugin } = require('./sqs')
const { registryPlugin } = require('./registry')

module.exports = async function buildFastify (deps) {
  const { db, auth, sqs, registry, logger = true } = deps
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
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true
  })

  fastify.register(routes)

  fastify.register(dbPlugin(db))
  fastify.register(authPlugin(auth))
  fastify.register(sqsPlugin(sqs))
  fastify.register(registryPlugin(registry))

  return fastify
}
