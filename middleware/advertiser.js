module.exports = async (req, res, ctx, done) => {
  try {
    const session = await ctx.auth.getUISession(req, ctx.auth.authKinds.ADVERTISER)
    if (!session) {
      res.status(401)
      return res.send()
    }
    ctx.session = session
  } catch (e) {
    res.status(401)
    return res.send()
  } finally {
    done()
  }
}
