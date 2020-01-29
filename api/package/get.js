module.exports = async (req, res, ctx) => {
  // TODO BEFORE MASTER don't allow maintainers to view other maintainers' packages
  try {
    ctx.log.info('getting owned packages for maintainer %s', req.query.maintainerId)
    res.send({
      success: true,
      packages: await ctx.db.getOwnedPackages(req.query.maintainerId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
