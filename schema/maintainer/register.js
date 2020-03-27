module.exports = {
  body: {
    type: 'object',
    required: ['maintainer'],
    properties: {
      maintainer: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', maxLength: 128 },
          lastName: { type: 'string', maxLength: 128 },
          email: {
            type: 'string',
            maxLength: 128,
            format: 'email'
          },
          password: {
            type: 'string',
            maxLength: 128,
            // eslint-disable-next-line no-useless-escape
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})'
          },
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
