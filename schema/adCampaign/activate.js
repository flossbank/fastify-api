module.exports = {
  body: {
    type: 'object',
    required: ['adCampaignId'],
    properties: {
      adCampaignId: { type: 'string', maxLength: 128 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
}
