module.exports = async (req, res, ctx) => {
  try {
    const { email, token } = req.body
    const success = await ctx.auth.validateUserToken(email, token, ctx.auth.authKinds.USER)
    if (!success) {
      res.status(401)
      return res.send()
    }
    res.send({ success })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
