module.exports = async (req, res, ctx) => {
  try {
    const { adCampaignId, adCampaign } = req.body
    await ctx.db.updateAdCampaign(req.session.advertiserId, adCampaignId, adCampaign)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
