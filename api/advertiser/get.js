module.exports = async (req, res, ctx) => {
  try {
    res.send({
      success: true,
      advertiser: await ctx.db.getAdvertiser(req.query.advertiserId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
