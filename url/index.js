const fastifyPlugin = require('fastify-plugin')
const { base32 } = require('rfc4648')
const { randomBytes } = require('crypto')

const UrlTableName = 'flossbank_urls'

class Url {
  constructor ({ config, docs }) {
    this.docs = docs
    this.host = config.getUrlHost()
  }

  // generate ID, persist it
  async createUrl (location, advertiserId) {
    let retries = 5
    do {
      // address space is 2^# of bits == 2^(8*5) == 2^40 == 1,099,511,627,776
      // probability of a collision is 2^(# of bits / 2) == 1/2^20 == 1/1,048,576
      // allowing 5 retries in the case of collisions gives this function a
      // 1/1,048,576 * 1/1,048,576 * 1/1,048,576 * 1/1,048,576 * 1/1,048,576 chance of failing
      // ... i think
      const urlId = base32.stringify(randomBytes(5))
      try {
        await this.docs.put({
          TableName: UrlTableName,
          Item: {
            urlId,
            location,
            advertiserId,
            hits: 0
          },
          ConditionExpression: 'urlId <> :urlId',
          ExpressionAttributeValues: { ':urlId': urlId }
        }).promise()
        return `https://${this.host}/u/${urlId}`
      } catch (e) {
        if (e.code === 'ConditionalCheckFailedException') {
          // this means the id already exists
          retries--
          continue
        }
        throw e
      }
    } while (retries > 0)
    throw new Error('unable to create unique url')
  }

  // get URL by id and also update hit count
  async getUrl (urlId) {
    let urlInfo = {}
    try {
      const { Attributes } = await this.docs.update({
        TableName: UrlTableName,
        Key: { urlId },
        UpdateExpression: 'SET hits = hits + :one',
        ConditionExpression: 'urlId = :urlId',
        ExpressionAttributeValues: {
          ':one': 1,
          ':urlId': urlId
        },
        ReturnValues: 'ALL_NEW'
      }).promise()
      urlInfo = Attributes
    } catch (e) {
      if (e.code === 'ConditionalCheckFailedException') {
        // this means the id doesn't exist
        return null
      }
      throw e
    }
    return urlInfo.location
  }
}

exports.Url = Url

exports.urlPlugin = (url) => fastifyPlugin(async (fastify) => {
  fastify.decorate('url', url)
})
