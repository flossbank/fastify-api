class AdDbController {
  constructor ({ db }) {
    this.db = db
  }

  async getBatch () {
    // more complicated logic and/or caching can come later
    const ads = await this.db.collection('advertisers').aggregate([
      // project advertiser documents as { _id: advertiserId, campaigns: <active campaigns> }
      // also filter out any campaigns with <1$ cpm
      {
        $project: {
          _id: '$_id',
          campaigns: {
            $filter: {
              input: '$adCampaigns',
              as: 'campaign',
              cond: {
                $and: [
                  { $eq: ['$$campaign.active', true] },
                  { $gte: ['$$campaign.cpm', 100000] }
                ]
              }
            }
          }
        }
      },
      // for each active campaign, project { _id: advertiserId, campaigns: {<the campaign>} }
      {
        $unwind: '$campaigns'
      },
      // project each resulting active campaign as { _id: advertiserId, ads: [<campaign ads>] }
      {
        $project: {
          _id: '$_id',
          campaignId: '$campaigns.id',
          ads: '$campaigns.ads'
        }
      },
      // for each ad in each active campaign, project { _id: advertiserId, ads: {<the ad>} }
      {
        $unwind: '$ads'
      },
      // project only the important parts of each ad (drop impressions)
      {
        $project: {
          _id: '$_id',
          campaignId: 1,
          ad: {
            title: '$ads.title',
            body: '$ads.body',
            url: '$ads.url',
            id: '$ads.id'
          }
        }
      },
      // randomly select 12 such documents
      // actually now selecting 11 (09/2020) since we are serving asingle EA ad as well
      // TODO -- set this dynamically
      {
        $sample: { size: 11 }
      }
    ]).toArray()

    // return ids in the form campaignId_adId for easier processing later
    return ads
      .reduce((acc, { ad: { id, title, body, url }, _id: advertiserId, campaignId }) => acc.concat({
        id: `${advertiserId}_${campaignId}_${id}`, title, body, url
      }), [])
  }
}

module.exports = AdDbController
