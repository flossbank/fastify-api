module.exports = async (req, res, ctx) => {
  try {
    res.send({
      success: true,
      revenue: await ctx.db.getRevenue(req.query.maintainerId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
