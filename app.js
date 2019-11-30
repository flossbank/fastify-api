const Fastify = require('fastify')
const routes = require('./routes')
const { authPlugin } = require('./auth')
const { dbPlugin } = require('./db')

module.exports = async function buildFastify (db, auth, logger = true) {
  const fastify = Fastify({ logger })
  fastify.register(require('fastify-cookie'))

  fastify.register(require('fastify-cors'), {
    // TODO stricter CORS settings when we have a frontend
  })

  fastify.register(routes)

  fastify.register(dbPlugin(db))
  fastify.register(authPlugin(auth))

  return fastify
}
