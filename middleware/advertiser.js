module.exports = async (req, res, ctx, done) => {
  const session = await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.ADVERTISER)
  if (!session) {
    res.status(401)
    return res.send()
  }
  ctx.session = session
  done()
}
