module.exports = async (req, res, ctx) => {
  try {
    // const campaign = await ctx.db.getAdCampaign(req.body.adCampaignId)
    // TODO allow update only if advertiser session matches advertiser id on campaign

    const ads = await ctx.db.getAdsByIds(req.body.ads)
    if (!ads.every(ad => ad.advertiserId === req.body.adCampaign.advertiserId)) {
      res.status(400)
      return res.send()
    }

    const { adCampaignId: id, adCampaign } = req.body
    await ctx.db.updateAdCampaign(id, adCampaign)
    res.send({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
