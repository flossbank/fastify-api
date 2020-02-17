module.exports = {
  body: {
    type: 'object',
    required: ['packages', 'language', 'registry'],
    properties: {
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
