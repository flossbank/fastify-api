module.exports = {
  querystring: {
    type: 'object',
    required: ['maintainerId'],
    properties: { maintainerId: { type: 'string' } }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        packages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              maintainers: {
                type: 'array',
                items: { type: 'string' }
              },
              owner: { type: 'string' },
              name: { type: 'string' },
              dividend: { type: 'number' },
              dividendAge: { type: 'number' },
              totalRevenue: { type: 'number' }
            }
          }
        },
        sessionId: { type: 'string' }
      }
    }
  }
}
