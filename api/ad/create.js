module.exports = async (req, res, ctx) => {
  if (!await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.ADVERTISER)) {
    res.status(401)
    return res.send()
  }
  try {
    const { ad } = req.body
    const advertiser = await ctx.db.getAdvertiser(ad.advertiserId)

    if (!advertiser || !advertiser.id) {
      res.status(400)
      return res.send()
    }

    const id = await ctx.db.createAd(ad)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
