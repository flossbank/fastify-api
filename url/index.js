const AWS = require('aws-sdk')
const fastifyPlugin = require('fastify-plugin')
const config = require('../config')

AWS.config.update(config.getAwsConfig())

const docs = new AWS.DynamoDB.DocumentClient()

// const UrlTableName = 'flossbank_urls'

function Url () {
  this.docs = docs
  this.host = config.getUrlHost()
}

// generate ID, persist it
Url.prototype.createUrl = async function createUrl (url, advertiserId) {
  const id = 'asdf'
  return `https://${this.host}/u/${id}`
}

// get URL by id and also update hit count
Url.prototype.getUrl = async function getUrl (id) {
  return 'http://localhost.com'
}

exports.Url = Url

exports.urlPlugin = (url) => fastifyPlugin(async (fastify) => {
  fastify.decorate('url', url)
})
