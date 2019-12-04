module.exports = {
  body: {
    type: 'object',
    properties: {
      maintainerId: { type: 'string' },
      packageRegistry: {
        type: 'string',
        enum: ['npm']
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
