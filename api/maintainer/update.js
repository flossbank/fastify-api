module.exports = async (req, res, ctx) => {
  if (!await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.MAINTAINER)) {
    res.status(401)
    return res.send()
  }
  try {
    const { maintainerId: id, maintainer } = req.body
    await ctx.db.updateMaintainer(id, maintainer)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
