module.exports = async (req, res, ctx) => {
  try {
    const { email: rawEmail } = req.body
    const email = rawEmail.toLowerCase()

    ctx.log.info('registering new user with email %s', email)
    await ctx.auth.sendToken(email, ctx.auth.authKinds.USER)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
