module.exports = {
  body: {
    type: 'object',
    required: ['packageId', 'package'],
    properties: {
      packageId: { type: 'string' },
      package: {
        type: 'object',
        required: ['maintainers', 'owner'],
        properties: {
          maintainers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['maintainerId'],
              properties: {
                maintainerId: { type: 'string' },
                revenuePercent: { type: 'number', default: 0 }
              }
            }
          },
          owner: {
            type: 'string'
          }
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
