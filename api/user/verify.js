module.exports = async (req, res, ctx) => {
  try {
    const { email, token } = req.body
    ctx.log.info('verifying user with email %s', email)

    if (!await ctx.auth.validateUserToken(email, token, ctx.auth.authKinds.USER)) {
      ctx.log.warn('attempt to verify user with invalid email or token')
      res.status(401)
      return res.send()
    }
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
