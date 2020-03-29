module.exports = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', maxLength: 128 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        code: { type: 'string' }
      }
    }
  }
}
