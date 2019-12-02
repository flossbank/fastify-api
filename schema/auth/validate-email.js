const { Auth } = require('../../auth')

module.exports = {
  body: {
    type: 'object',
    required: ['email', 'token', 'kind'],
    properties: {
      email: { type: 'string' },
      token: { type: 'string' },
      kind: {
        type: 'string',
        enum: Object.keys(Auth.prototype.authKinds)
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
