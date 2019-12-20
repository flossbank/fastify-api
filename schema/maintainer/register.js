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
          email: { type: 
            'string', 
            maxLength: 128,
            pattern: '^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$' 
          },
          password: { 
            type: 'string', 
            maxLength: 128,
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
