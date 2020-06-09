module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('getting ad campaign %s for %s', req.query.adCampaignId, req.session.advertiserId)
    res.send({
      success: true,
      adCampaign: await ctx.db.advertiser.getAdCampaign({
        advertiserId: req.session.advertiserId,
        campaignId: req.query.adCampaignId
      })
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: 'Internal server error' })
  }
}
