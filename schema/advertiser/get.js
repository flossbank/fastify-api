module.exports = {
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
                        impressions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              timestamp: { type: 'number' }
                            }
                          }
                        }
                      }
                    }
                  },
                  maxSpend: { type: 'number' },
                  createDate: { type: 'number' },
                  startDate: { type: 'number' },
                  endDate: { type: 'number' },
                  approved: { type: 'boolean' },
                  active: { type: 'boolean' },
                  cpm: { type: 'number' }
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
