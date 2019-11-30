const Fastify = require('fastify')
const routes = require('./routes')
const { authPlugin } = require('./auth')
const { dbPlugin } = require('./db')
const { sqsPlugin } = require('./sqs')

module.exports = async function buildFastify ({ db, auth, sqs, logger = true }) {
  const fastify = Fastify({ logger })
  fastify.register(require('fastify-cookie'))

  fastify.register(require('fastify-cors'), {
    // TODO stricter CORS settings when we have a frontend
  })

  fastify.register(routes)

  fastify.register(dbPlugin(db))
  fastify.register(authPlugin(auth))
  fastify.register(sqsPlugin(sqs))

  return fastify
}
