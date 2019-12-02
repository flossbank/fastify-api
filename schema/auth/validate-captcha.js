module.exports = {
  body: {
    type: 'object',
    required: ['token', 'email', 'response'],
    properties: {
      token: { type: 'string' },
      email: { type: 'string' },
      response: { type: 'string' }
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
