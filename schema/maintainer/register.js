module.exports = {
  body: {
    type: 'object',
    required: ['maintainer'],
    properties: {
      maintainer: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', maxLength: 128 },
          email: { type: 'string', maxLength: 128 },
          password: { type: 'string', maxLength: 128 },
          tokens: {
            type: 'object',
            properties: {
              npm: { type: 'string', maxLength: 512 }
            }
          },
          payoutInfo: { type: 'string', maxLength: 256 }
        }
      }
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
