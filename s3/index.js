const fastifyPlugin = require('fastify-plugin')

class S3 {
  constructor ({ s3, config }) {
    this.s3 = s3
    this.config = config
  }

  async writeDistributeOrgDonationInitialState (correlationId, {
    organizationId,
    amount,
    timestamp = Date.now(),
    description
  }) {
    const params = {
      Body: JSON.stringify({
        entryPoint: 'API',
        redistributedDonation: false, // Decompress uses this field
        organizationId,
        amount,
        timestamp,
        description
      }),
      Bucket: this.config.getOrgDodBucketName(),
      Key: `${correlationId}/initial_state.json`
    }
    return this.s3.putObject(params).promise()
  }

  async putTopLevelPackages ({ correlationId, extractedDependencies }) {
    return Promise.all(extractedDependencies.map(async ({ language, registry, deps }) => {
      const params = {
        Body: JSON.stringify(deps),
        Bucket: this.config.getOrgDodBucketName(),
        Key: `${correlationId}/${language}_${registry}_top_level_packages.json`
      }
      return this.s3.putObject(params).promise()
    }))
  }
}

exports.S3 = S3

exports.s3Plugin = (s3) => fastifyPlugin(async (fastify) => {
  fastify.decorate('s3', s3)
})
