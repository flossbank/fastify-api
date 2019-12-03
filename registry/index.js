const fastifyPlugin = require('fastify-plugin')
const NpmRegistry = require('./npm')

function Registry () {
  this.npm = new NpmRegistry()
}

exports.Registry = Registry

exports.registryPlugin = (registry) => fastifyPlugin(async (fastify) => {
  fastify.decorate('registry', registry)
})
