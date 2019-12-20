module.exports = {
  body: {
    type: 'object',
    required: ['token', 'email', 'response'],
    properties: {
      token: { type: 'string', maxLength: 128 },
      email: { type: 'string', maxLength: 128 },
      response: { type: 'string', maxLength: 1024 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        apiKey: { type: 'string' }
      }
    }
  }
}
