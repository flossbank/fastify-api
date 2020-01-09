module.exports = {
  body: {
    type: 'object',
    required: ['email', 'token'],
    properties: {
      email: { type: 'string', maxLength: 128 },
      token: { type: 'string', maxLength: 128 }
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
