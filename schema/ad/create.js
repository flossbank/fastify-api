module.exports = {
  body: {
    type: 'object',
    required: ['ad'],
    properties: {
      ad: {
        type: 'object',
        required: ['name', 'advertiserId', 'content'],
        properties: {
          name: { type: 'string' },
          advertiserId: { type: 'string' },
          content: {
            type: 'object',
            required: ['title', 'body', 'url'],
            properties: {
              title: { type: 'string' },
              body: { type: 'string' },
              url: { type: 'string' }
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
        success: { type: 'boolean' },
        id: { type: 'string' }
      }
    }
  }
}
