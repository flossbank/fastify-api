module.exports = async (req, res, ctx) => {
  try {
    const maintainer = await ctx.db.getMaintainer(req.query.maintainerId)
    if (!maintainer || !maintainer.verified) {
      res.status(400)
      return res.send({ success: false })
    }
    res.send({
      success: true,
      maintainer
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
