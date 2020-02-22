module.exports = {
  body: {
    type: 'object',
    properties: { sessionId: { type: 'string' } }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        ads: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              advertiserId: { type: 'string' },
              id: { type: 'string' },
              title: { type: 'string' },
              body: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        sessionId: { type: 'string' }
      }
    }
  }
}
