module.exports = {
  body: {
    type: 'object',
    required: ['advertiserId', 'ads', 'maxSpend', 'cpm', 'name'],
    properties: {
      advertiserId: { type: 'string' },
      ads: {
        type: 'array',
        items: { type: 'string' }
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
    }
  }
}
