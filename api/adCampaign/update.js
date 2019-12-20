const { compare } = require('js-deep-equals')

module.exports = async (req, res, ctx) => {
  try {
    const campaign = await ctx.db.getAdCampaign(req.body.adCampaignId)

    if (campaign.advertiserId !== req.session.advertiserId) {
      res.status(401)
      return res.send({ success: false })
    }

    // TODO: Validate ad values aren't too long in length

    // Set all modified as well as new ads approved key to "false"
    const previousAds = campaign.ads.reduce((acc, ad) => {
      acc[ad.id] = ad
      return acc
    }, {})

    req.body.adCampaign.ads.map((ad) => {
      const isExistingAd = (typeof previousAds[ad.id] !== 'undefined')
      const adWasApproved = isExistingAd && previousAds[ad.id].approved === true

      if (adWasApproved && compare(ad, previousAds[ad.id])) {
        return ad
      }

      return Object.assign({}, ad, { approved: false })
    })

    const { adCampaignId: id, adCampaign } = req.body
    // All ad campaigns that are updated should immediately be set to inactive
    adCampaign.active = false

    await ctx.db.updateAdCampaign(id, adCampaign)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
