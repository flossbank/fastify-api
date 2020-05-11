module.exports = async (req, res, ctx) => {
  ctx.log.info('getting all campaigns for %s', req.session.advertiserId)
  try {
    res.send({
      success: true,
      adCampaigns: await ctx.db.getAdCampaignsForAdvertiser({ advertiserId: req.session.advertiserId })
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
