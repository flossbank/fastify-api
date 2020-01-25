module.exports = {
  body: {
    type: 'object',
    required: ['adCampaign'],
    properties: {
      adCampaign: {
        type: 'object',
        required: ['maxSpend', 'cpm', 'name'],
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
        maxSpend: { 
          type: 'number',
          minimum: 500000
        },
        cpm: {
          type: 'number',
          minimum: 500000
        },
        name: { type: 'string' }
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
        success: { type: 'boolean' },
        id: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
}
