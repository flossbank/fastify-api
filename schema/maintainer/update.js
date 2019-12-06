module.exports = {
  body: {
    type: 'object',
    required: ['maintainerId', 'maintainer'],
    properties: {
      maintainerId: { type: 'string' },
      maintainer: {
        type: 'object',
        required: ['payoutInfo'],
        properties: {
          payoutInfo: { type: 'string' },
          npmToken: { type: 'string' }
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
