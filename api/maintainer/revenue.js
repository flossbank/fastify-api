module.exports = async (req, res, ctx) => {
  // TODO BEFORE MASTER don't allow maintainers to view other maintainers' revenue
  try {
    ctx.log.info('getting revenue for maintainer %s', req.query.maintainerId)
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
