module.exports = async (req, res, ctx) => {
  try {
    const { email, token, kind } = req.body
    const success = await ctx.auth.validateUserToken(email, token, kind)
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
