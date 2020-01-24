module.exports = {
  querystring: {
    type: 'object',
    required: ['advertiserId'],
    properties: {
      advertiserId: { type: 'string', maxLength: 128 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        advertiser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            organization: { type: 'string' },
            adCampaigns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  ads: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        title: { type: 'string' },
                        body: { type: 'string' },
                        url: { type: 'string' },
                        approved: { type: 'boolean' }
                      }
                    }
                  },
                  maxSpend: { type: 'number' },
                  createDate: { type: 'number' },
                  startDate: { type: 'number' },
                  endDate: { type: 'number' },
                  approved: { type: 'boolean' },
                  active: { type: 'boolean' },
                  cpm: { type: 'number' },
                  spend: { type: 'number' }
                }
              }
            },
            active: { type: 'boolean' },
            verified: { type: 'boolean' },
            adDrafts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  title: { type: 'string' },
                  body: { type: 'string' },
                  url: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
}
