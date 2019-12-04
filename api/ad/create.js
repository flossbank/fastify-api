module.exports = async (req, res, ctx) => {
  try {
    const id = await ctx.db.createAd(req.body.ad)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
