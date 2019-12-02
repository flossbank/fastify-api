module.exports = {
  body: {
    type: 'object',
    required: ['advertiserId', 'advertiser'],
    properties: {
      advertiserId: { type: 'string' },
      advertiser: {
        type: 'object',
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
