module.exports = async (req, res, ctx) => {
  if (!await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.ADVERTISER)) {
    res.status(401)
    return res.send()
  }
  try {
    const advertiser = await ctx.db.getAdvertiser(req.body.advertiserId)
    if (!advertiser || !advertiser.id) {
      res.status(400)
      return res.send()
    }
    res.send({
      success: true,
      id: await ctx.db.createAdCampaign(req.body)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
