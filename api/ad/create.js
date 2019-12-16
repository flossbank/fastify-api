module.exports = async (req, res, ctx) => {
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
