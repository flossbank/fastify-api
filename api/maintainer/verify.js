module.exports = async (req, res, ctx) => {
  const { email: rawEmail, token } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('verifying maintainer with email %s', email)
    if (!await ctx.auth.validateToken(email, token, ctx.auth.authKinds.MAINTAINER)) {
      ctx.log.warn('attempt to verify maintainer with invalid email or token from email %s', email)
      res.status(401)
      return res.send()
    }
    await ctx.db.verifyMaintainer(email)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
