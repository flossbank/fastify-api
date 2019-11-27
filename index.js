const fastify = require('fastify')({
  logger: true
})
require('dotenv').config()

fastify.register(require('./db/index'))
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
