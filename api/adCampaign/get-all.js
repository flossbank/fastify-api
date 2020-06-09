module.exports = async (req, res, ctx) => {
  ctx.log.info('getting all campaigns for %s', req.session.advertiserId)
  try {
    res.send({
      success: true,
      adCampaigns: await ctx.db.advertiser.getAdCampaignsForAdvertiser({ advertiserId: req.session.advertiserId })
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: 'Internal server error' })
  }
}
