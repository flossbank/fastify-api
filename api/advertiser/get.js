module.exports = async (req, res, ctx) => {
  try {
    const advertiser = await ctx.db.getAdvertiser(req.query.advertiserId)
    if (!advertiser || !advertiser.verified) {
      res.status(400)
      return res.send({ success: false })
    }
    res.send({
      success: true,
      advertiser
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
