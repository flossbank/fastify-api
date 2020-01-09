module.exports = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', maxLength: 128 },
      password: { type: 'string', maxLength: 128 }
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
            firstName: { type: 'string' },
            lastName: { type: 'string' },
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
