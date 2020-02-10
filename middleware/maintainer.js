module.exports = async (req, res, ctx) => {
  try {
    const session = await ctx.auth.getUISession(req, ctx.auth.authKinds.MAINTAINER)
    if (!session) {
      ctx.log.warn('attempt to access authenticated maintainer route without valid session')
      res.status(401)
      return res.send()
    }
    req.session = session
  } catch (e) {
    res.status(401)
    return res.send()
  }
}
