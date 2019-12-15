module.exports = async (req, res, ctx) => {
  if (!await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.ADVERTISER)) {
    res.status(401)
    return res.send()
  }
  try {
    const { advertiserId: id, advertiser } = req.body
    await ctx.db.updateAdvertiser(id, advertiser)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
