module.exports = {
  body: {
    type: 'object',
    required: ['billingToken', 'last4'],
    properties: {
      billingToken: { type: 'string', maxLength: 128 },
      last4: { type: 'string', maxLength: 4 }
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
