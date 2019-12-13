module.exports = async (req, res, ctx) => {
  const { email, token } = req.body
  try {
    if (!await ctx.auth.validateUserToken(email, token, ctx.auth.authKinds.ADVERTISER)) {
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
