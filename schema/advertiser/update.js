module.exports = {
  body: {
    type: 'object',
    required: ['advertiser'],
    properties: {
      advertiser: {
        type: 'object',
        required: ['id'],
        properties: {
          organization: { type: 'string' },
          adCampaigns: {
            type: 'array',
            items: { type: 'string' }
          },
          billingInfo: { type: 'string' }
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
