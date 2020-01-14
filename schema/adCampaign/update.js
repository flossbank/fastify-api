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
              required: ['name', 'title', 'body', 'url'],
              properties: {
                name: { type: 'string', maxLength: 128 },
                title: { type: 'string', maxLength: 128 },
                body: { type: 'string', maxLength: 256 },
                url: { type: 'string', maxLength: 128 },
                id: { type: 'string', maxLength: 128 },
                approved: { type: 'boolean' }
              }
            }
          },
          name: { type: 'string', maxLength: 128 },
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
