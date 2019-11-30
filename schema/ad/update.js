module.exports = {
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
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
