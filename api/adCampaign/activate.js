module.exports = async (req, res, ctx) => {
  try {
    const { adCampaignId: id } = req.body
    const campaign = await ctx.db.getAdCampaign(id)
    // TODO allow activation only if advertiser session matches advertiser id on campaign

    const ads = await ctx.db.getAdsByIds(campaign.ads)
    if (!ads.every(ad => ad.approved)) {
      res.status(400)
      return res.send({
        success: false,
        message: 'All ads in a campaign must be approved before activating'
      })
    }

    await ctx.db.activateAdCampaign(id)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
