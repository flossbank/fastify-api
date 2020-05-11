module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info(req.body, 'activating campaign for %s', req.session.advertiserId)
    const { adCampaignId } = req.body
    const campaign = await ctx.db.advertiser.getAdCampaign({
      advertiserId: req.session.advertiserId,
      campaignId: adCampaignId
    })
    if (!campaign.approved) {
      ctx.log.warn('attempt to activate unapproved campaign, rejecting request from %s', req.session.advertiserId)
      res.status(400)
      return res.send({
        success: false,
        message: 'Campaign must be approved before activating'
      })
    }

    await ctx.db.advertiser.activateAdCampaign({
      advertiserId: req.session.advertiserId,
      campaignId: adCampaignId
    })
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
