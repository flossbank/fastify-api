module.exports = {
  body: {
    type: 'object',
    required: ['maintainerId', 'maintainer'],
    properties: {
      maintainerId: { type: 'string' },
      maintainer: {
        type: 'object',
        required: ['payoutEmail'],
        properties: {
          payoutEmail: { type: 'string' }
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
