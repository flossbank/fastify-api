module.exports = async (req, res, ctx) => {
  if (req.query.advertiserId !== req.session.advertiserId) {
    ctx.log.warn(
      'attempt to get ads for different advertiser id; requested: %s, authorized: %s',
      req.query.advertiserId,
      req.session.advertiserId
    )
    res.status(401)
    return res.send({ success: false })
  }
  ctx.log.info('getting all campaigns for %s', req.session.advertiserId)
  try {
    res.send({
      success: true,
      adCampaigns: await ctx.db.getAdCampaignsForAdvertiser(req.query.advertiserId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
