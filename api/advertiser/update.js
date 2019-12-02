module.exports = async (req, res, ctx) => {
  try {
    await ctx.db.updateAdvertiser(req.body.advertiser)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
