const fastify = require('fastify')({
  logger: true
})
require('dotenv').config()

// Attach our db instance
fastify.register(require('./db/index'))
// Register our routes
fastify.register(require('./routes/index'))

const start = async () => {
  try {
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()