module.exports = async (req, res, ctx) => {
  const { email, token } = req.body
  try {
    ctx.log.info('verifying advertiser with email %s', email)
    if (!await ctx.auth.validateUserToken(email, token, ctx.auth.authKinds.ADVERTISER)) {
      ctx.log.warn('attempt to verify advertiser with invalid email or token from %s', email)
      res.status(401)
      return res.send()
    }
    await ctx.db.verifyAdvertiser(email)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
