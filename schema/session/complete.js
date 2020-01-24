module.exports = {
  body: {
    type: 'object',
    required: ['seen', 'sessionId'],
    properties: {
      seen: {
        type: 'array',
        items: { type: 'string', maxLength: 128 }
      },
      sessionId: { type: 'string' }
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
