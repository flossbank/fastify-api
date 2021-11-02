const fastifyPlugin = require('fastify-plugin')

class S3 {
  constructor ({ s3 }) {
    this.s3 = s3
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
      Bucket: 'org-donation-state',
      Key: `${correlationId}/initial_state.json`
    }
    return this.s3.putObject(params).promise()
  }
}

exports.S3 = S3

exports.s3Plugin = (s3) => fastifyPlugin(async (fastify) => {
  fastify.decorate('s3', s3)
})
