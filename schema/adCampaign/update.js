module.exports = {
  body: {
    type: 'object',
    required: ['adCampaign', 'adCampaignId'],
    properties: {
      adCampaignId: { type: 'string' },
      adCampaign: {
        type: 'object',
        required: ['advertiserId'],
        properties: {
          advertiserId: { type: 'string' },
          ads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                content: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    body: { type: 'string' },
                    url: { type: 'string' }
                  }
                }
              }
            }
          },
          name: { type: 'string' },
          maxSpend: { type: 'number' },
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
