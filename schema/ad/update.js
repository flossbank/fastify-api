module.exports = {
  body: {
    type: 'object',
    required: ['adId', 'ad'],
    properties: {
      adId: { type: 'string' },
      ad: {
        properties: {
          name: { type: 'string' },
          content: {
            type: 'object',
            properties: {
              body: { type: 'string' },
              url: { type: 'string' },
              title: { type: 'string' }
            }
          }
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
