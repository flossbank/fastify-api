module.exports = async (req, res, ctx) => {
  if (!await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.ADVERTISER)) {
    res.status(401)
    return res.send()
  }
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
