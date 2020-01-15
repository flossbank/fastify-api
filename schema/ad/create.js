module.exports = {
  body: {
    type: 'object',
    required: ['name', 'title', 'body', 'url'],
    properties: {
      name: { type: 'string', maxLength: 128 },
      title: { type: 'string', maxLength: 128 },
      body: { type: 'string', maxLength: 256 },
      url: { type: 'string', maxLength: 128 }
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
