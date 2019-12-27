module.exports = async (req, res, ctx) => {
  try {
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
