module.exports = {
  querystring: {
    type: 'object',
    required: ['advertiserId'],
    properties: {
      advertiserId: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        adCampaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              advertiserId: { type: 'string' },
              name: { type: 'string' },
              ads: {
                type: 'array',
                items: { type: 'string' }
              },
              maxSpend: { type: 'number' },
              createDate: { type: 'number' },
              startDate: { type: 'number' },
              endDate: { type: 'number' },
              approved: { type: 'boolean' },
              active: { type: 'boolean' },
              cpm: { type: 'number' },
              spend: { type: 'number' }
            }
          }
        }
      }
    }
  }
}