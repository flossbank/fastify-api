const { compareUnsorted } = require('js-deep-equals')

module.exports = async (req, res, ctx) => {
  try {
    const campaign = await ctx.db.getAdCampaign(req.body.adCampaignId)

    if (campaign.advertiserId !== req.session.advertiserId) {
      res.status(401)
      return res.send({ success: false })
    }

    if (!req.body.adCampaign.ads.every(ad => ad.advertiserId === req.body.adCampaign.advertiserId)) {
      res.status(400)
      return res.send()
    }

    // TODO: Validate ad values aren't too long in length

    // Set all modified as well as new ads approved key to "false"
    const previousAds = campaign.ads.map(ad => ({
      [ad.id]: ad
    }))

    req.body.adCampaign.ads.forEach((ad) => {
      const isExistingAd = previousAds[ad.id] !== undefined
      const adWasApproved = isExistingAd && previousAds[ad.id].approved === true

      if (isExistingAd && adWasApproved && compareUnsorted(ad, previousAds[ad.id])) {
        continue
      }

      ad.approved = false
    })

    const { adCampaignId: id, adCampaign } = req.body
    await ctx.db.updateAdCampaign(id, adCampaign)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
