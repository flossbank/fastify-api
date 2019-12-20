module.exports = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string' },
      password: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
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
