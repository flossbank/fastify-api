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
        ads: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              active: { type: 'boolean' },
              approved: { type: 'boolean' },
              advertiserId: { type: 'string' },
              name: { type: 'string' },
              content: {
                type: 'object',
                properties: {
                  body: { type: 'string' },
                  title: { type: 'string' },
                  url: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
}
