module.exports = {
  body: {
    type: 'object',
    required: ['seen', 'sessionId'],
    properties: {
      seen: {
        type: 'array',
        items: { type: 'string', maxLength: 128 }
      },
      packages: {
        type: 'array',
        items: { type: 'string' }
      },
      registry: { type: 'string' },
      language: { type: 'string' },
      metadata: {
        type: 'object',
        properties: {
          packageManagerVersion: { type: 'string' },
          flossbankVersion: { type: 'string' }
        }
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
