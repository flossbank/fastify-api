const fastify = require('fastify')({
  logger: true
})
fastify.register(require('fastify-cookie'))
require('dotenv').config()

fastify.register(require('fastify-cors'), {
  // TODO stricter CORS settings when we have a frontend
})
fastify.register(require('./db/index'))
fastify.register(require('./routes/index'))

const start = async () => {
  try {
    await fastify.listen(8081)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
