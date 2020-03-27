module.exports = {
  querystring: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        maxLength: 128,
        format: 'email'
      }
    }
  },
  response: {
    200: {
      type: 'string'
    }
  }
}
