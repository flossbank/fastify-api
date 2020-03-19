module.exports = {
  body: {
    type: 'object',
    required: ['email', 'apiKey'],
    properties: {
      email: { type: 'string', maxLength: 128 },
      apiKey: { type: 'string', maxLength: 128 }
    }
  }
}
