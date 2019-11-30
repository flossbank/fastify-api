module.exports = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string' }
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
