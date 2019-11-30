module.exports = async (req, res, ctx) => {
  try {
    await ctx.db.updateAd(req.body.ad)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
