module.exports = async (req, res, ctx) => {
  try {
    const id = await await ctx.db.createAdvertiser(req.body.advertiser)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
