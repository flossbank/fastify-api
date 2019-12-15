module.exports = async (req, res, ctx) => {
  if (!await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.ADVERTISER)) {
    res.status(401)
    return res.send()
  }
  try {
    // const campaign = await ctx.db.getAdCampaign(req.body.adCampaignId)
    // TODO allow update only if advertiser session matches advertiser id on campaign

    const ads = await ctx.db.getAdsByIds(req.body.adCampaign.ads)
    if (!ads.every(ad => ad.advertiserId === req.body.adCampaign.advertiserId)) {
      // TODO use the advertiser id from session, not body
      res.status(400)
      return res.send()
    }

    const { adCampaignId: id, adCampaign } = req.body
    await ctx.db.updateAdCampaign(id, adCampaign)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
