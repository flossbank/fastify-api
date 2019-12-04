module.exports = {
  body: {
    type: 'object',
    required: ['adCampaignId'],
    properties: {
      adCampaignId: { type: 'string' }
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
