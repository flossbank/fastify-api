module.exports = {
  querystring: {
    type: 'object',
    required: ['advertiserId'],
    properties: {
      advertiserId: { type: 'string', maxLength: 128 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        advertiser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            organization: { type: 'string' },
            adCampaigns: {
              type: 'array',
              items: { type: 'string' }
            },
            active: { type: 'boolean' },
            verified: { type: 'boolean' }
          }
        }
      }
    }
  }
}
