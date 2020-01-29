module.exports = {
  body: {
    type: 'object',
    required: ['url'],
    properties: { url: { type: 'string' } }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        url: { type: 'string' }
      }
    }
  }
}
