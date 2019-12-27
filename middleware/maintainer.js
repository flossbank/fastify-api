module.exports = async (req, res, ctx, done) => {
  try {
    const session = await ctx.auth.getUISession(req, ctx.auth.authKinds.MAINTAINER)
    if (!session) {
      res.status(401)
      return res.send()
    }
    ctx.decorateRequest('session', session)
    done()
  } catch (e) {
    res.status(401)
    return res.send()
  }
}
