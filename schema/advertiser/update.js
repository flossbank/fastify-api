module.exports = {
  body: {
    type: 'object',
    required: ['advertiserId', 'advertiser'],
    properties: {
      advertiserId: { type: 'string', maxLength: 128 },
      advertiser: {
        type: 'object',
        properties: {
          organization: { type: 'string', maxLength: 128 },
          billingToken: { type: 'string', maxLength: 128 }
        }
      }
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
