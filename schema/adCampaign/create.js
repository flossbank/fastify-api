module.exports = {
  body: {
    type: 'object',
    required: ['advertiserId', 'ads', 'maxSpend', 'cpm', 'name'],
    properties: {
      advertiserId: { type: 'string' },
      ads: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'content'],
          properties: {
            name: { type: 'string' },
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
      },
      maxSpend: { type: 'number' },
      cpm: {
        type: 'number',
        minimum: 100
      },
      name: { type: 'string' }
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
