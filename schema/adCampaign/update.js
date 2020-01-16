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
            items: { type: 'string', maxLength: 128 }
          },
          name: { type: 'string', maxLength: 128 },
          maxSpend: { type: 'number' },
          id: { type: 'string', maxLength: 128 },
          cpm: { type: 'number', minimum: 100 },
          startDate: { type: 'number' },
          endDate: { type: 'number' }
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
