module.exports = {
  body: {
    type: 'object',
    required: ['adCampaign', 'adCampaignId'],
    properties: {
      adCampaignId: { type: 'string', maxLength: 128 },
      adCampaign: {
        type: 'object',
        properties: {
          ads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                title: { type: 'string' },
                body: { type: 'string' },
                url: { type: 'string' }
              }
            }
          },
          name: { type: 'string', maxLength: 128 },
          maxSpend: { 
            type: 'number',
            minimum: 500000 
          },
          id: { type: 'string', maxLength: 128 },
          cpm: { type: 'number', minimum: 500000 },
          startDate: { type: 'number' },
          endDate: { type: 'number' }
        }
      },
      adDrafts: {
        type: 'array',
        items: { type: 'string', maxLength: 128 }
      },
      keepDrafts: { type: 'boolean' }
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
