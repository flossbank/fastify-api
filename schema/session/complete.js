module.exports = {
  body: {
    type: 'object',
    required: ['seen', 'sessionId'],
    properties: {
      seen: {
        type: 'array',
        items: { type: 'string' }
      },
      sessionId: { type: 'string' }
    }
  },
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: { type: 'string' }
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
