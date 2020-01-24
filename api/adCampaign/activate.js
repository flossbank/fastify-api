module.exports = async (req, res, ctx) => {
  try {
    const { adCampaignId } = req.body
    const campaign = await ctx.db.getAdCampaign(req.session.advertiserId, adCampaignId)
    if (!campaign.approved) {
      res.status(400)
      return res.send({
        success: false,
        message: 'Campaign must be approved before activating'
      })
    }

    await ctx.db.activateAdCampaign(req.session.advertiserId, adCampaignId)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
