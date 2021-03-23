const fastifyPlugin = require('fastify-plugin')
const NpmRegistry = require('./npm')
const RubyGemsRegistry = require('./rubygems')

class Registry {
  constructor () {
    this.npm = new NpmRegistry()
    this.rubygems = new RubyGemsRegistry()
    this.supported = new Set(['npm', 'rubygems'])
  }

  isSupported (registry) {
    return this.supported.has(registry)
  }
}

exports.Registry = Registry

exports.registryPlugin = (registry) => fastifyPlugin(async (fastify) => {
  fastify.decorate('registry', registry)
})
