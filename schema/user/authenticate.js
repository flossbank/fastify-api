module.exports = {
  body: {
    type: 'object',
    required: ['email', 'token'],
    properties: {
      email: { type: 'string', maxLength: 128, format: 'email' },
      token: { type: 'string', maxLength: 128 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            billingInfo: {
              type: 'object',
              properties: {
                last4: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
}
