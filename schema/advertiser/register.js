module.exports = {
  body: {
    type: 'object',
    required: ['advertiser'],
    properties: {
      advertiser: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', maxLength: 128 },
          lastName: { type: 'string', maxLength: 128 },
          organization: { type: 'string', maxLength: 128 },
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
          }
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
