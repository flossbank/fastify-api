module.exports = async (req, res, ctx) => {
  try {
    await ctx.auth.sendUserToken(req.body.email, ctx.auth.authKinds.USER)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}