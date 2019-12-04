module.exports = async (req, res, ctx) => {
  try {
    res.send({
      ads: await ctx.db.getAdsByAdvertiser(req.query.advertiserId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
