module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info(req.body, 'registering new user')
    await ctx.auth.sendToken(req.body.email, ctx.auth.authKinds.USER)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
