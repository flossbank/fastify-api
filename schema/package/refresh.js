module.exports = {
  body: {
    type: 'object',
    required: ['maintainerId', 'packageRegistry'],
    properties: {
      maintainerId: { type: 'string', maxLength: 128 },
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
