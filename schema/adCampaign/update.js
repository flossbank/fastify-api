module.exports = {
  type: 'object',
  required: ['adCampaign', 'adCampaignId'],
  properties: {
    adCampaignId: { type: 'string' },
    adCampaign: {
      type: 'object',
      properties: {
        advertiserId: { type: 'string' },
        ads: {
          type: 'array',
          items: { type: 'string' }
        },
        name: { type: 'string' },
        maxSpend: { type: 'number' },
        cpm: { type: 'number', minimum: 100 },
        startDate: { type: 'number' },
        endDate: { type: 'number' }
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
