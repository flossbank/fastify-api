module.exports = {
  querystring: {
    type: 'object',
    required: ['maintainerId'],
    properties: {
      maintainerId: { type: 'string', maxLength: 128 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        revenue: { type: 'number' }
      }
    }
  }
}
