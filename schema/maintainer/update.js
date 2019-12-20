module.exports = {
  body: {
    type: 'object',
    required: ['maintainerId', 'maintainer'],
    properties: {
      maintainerId: { type: 'string', maxLength: 128 },
      maintainer: {
        type: 'object',
        required: ['payoutInfo'],
        properties: {
          payoutInfo: { type: 'string', maxLength: 256 },
          tokens: {
            type: 'object',
            properties: {
              npm: { type: 'string', maxLength: 512 }
            }
          }
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  }
}
