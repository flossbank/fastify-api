module.exports = {
  body: {
    type: 'object',
    required: ['token', 'email'],
    properties: {
      token: { type: 'string', maxLength: 128 },
      email: { type: 'string', maxLength: 128 }
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
