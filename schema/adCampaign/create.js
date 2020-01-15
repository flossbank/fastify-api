module.exports = {
  body: {
    type: 'object',
    required: ['maxSpend', 'cpm', 'name'],
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
            url: { type: 'string', maxLength: 128 }
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
