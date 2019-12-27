module.exports = async (req, res, ctx) => {
  // TODO: validate email and password against regex
  const { maintainer } = req.body
  try {
    const id = await ctx.db.createMaintainer(maintainer)
    await ctx.auth.sendUserToken(maintainer.email, ctx.auth.authKinds.MAINTAINER)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
