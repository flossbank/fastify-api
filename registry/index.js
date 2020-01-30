const fastifyPlugin = require('fastify-plugin')
const NpmRegistry = require('./npm')

function Registry () {
  this.npm = new NpmRegistry()
  this.supported = ['npm']
}

Registry.prototype.isSupported = function isSupported (registry) {
  return this.supported.includes(registry)
}

exports.Registry = Registry

exports.registryPlugin = (registry) => fastifyPlugin(async (fastify) => {
  fastify.decorate('registry', registry)
})
