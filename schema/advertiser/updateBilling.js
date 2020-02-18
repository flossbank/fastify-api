module.exports = {
  body: {
    type: 'object',
    required: ['billingToken'],
    properties: {
      billingToken: { type: 'string', maxLength: 128 }
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
