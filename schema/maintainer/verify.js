module.exports = {
  body: {
    type: 'object',
    required: ['token', 'email'],
    properties: {
      token: { type: 'string' },
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
