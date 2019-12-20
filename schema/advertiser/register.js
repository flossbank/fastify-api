module.exports = {
  body: {
    type: 'object',
    required: ['advertiser'],
    properties: {
      advertiser: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', maxLength: 128 },
          email: { type: 'string', maxLength: 128 },
          organization: { type: 'string', maxLength: 128 },
          password: { type: 'string', maxLength: 128 }
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
