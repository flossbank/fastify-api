const createAd = require('../api/ad/create')

async function routes (fastify, opts, next) {
  fastify.post('/api/ad/create', (req, res) => createAd(req, res, fastify))

  next()
}

module.exports = routes
