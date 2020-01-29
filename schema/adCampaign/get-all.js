module.exports = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
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
        }
      }
    }
  }
}
