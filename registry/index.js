const fastifyPlugin = require('fastify-plugin')
const NpmRegistry = require('./npm')

class Registry {
  constructor () {
    this.npm = new NpmRegistry()
    this.supported = new Set(['npm'])
  }

  isSupported (registry) {
    return this.supported.has(registry)
  }
}

exports.Registry = Registry

exports.registryPlugin = (registry) => fastifyPlugin(async (fastify) => {
  fastify.decorate('registry', registry)
})
