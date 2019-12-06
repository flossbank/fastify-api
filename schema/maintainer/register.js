module.exports = {
  body: {
    type: 'object',
    required: ['maintainer'],
    properties: {
      maintainer: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          npmToken: { type: 'string' },
          payoutInfo: { type: 'string' },
          verified: { type: 'boolean', default: false },
          active: { type: 'boolean', default: true }
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
