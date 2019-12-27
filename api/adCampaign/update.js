module.exports = async (req, res, ctx) => {
  try {
    const campaign = await ctx.db.getAdCampaign(req.body.adCampaignId)

    if (campaign.advertiserId !== req.session.advertiserId || req.body.adCampaign.advertiserId !== req.session.advertiserId) {
      res.status(401)
      return res.send({ success: false })
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
