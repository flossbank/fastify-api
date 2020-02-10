module.exports = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        maintainer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            payoutInfo: { type: 'string' }
          }
        }
      }
    }
  }
}
