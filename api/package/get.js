module.exports = async (req, res, ctx) => {
  if (!await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.MAINTAINER)) {
    res.status(401)
    return res.send()
  }
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
