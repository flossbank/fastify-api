module.exports = async (req, res, ctx) => {
  try {
    const { email: rawEmail } = req.body
    const email = rawEmail.toLowerCase()

    const existingUser = await ctx.db.user.getByEmail({ email })
    if (existingUser) {
      ctx.log.warn('attempt to register with an email that is already registered %s', email)
      res.status(409)
      return res.send({ success: false })
    }

    ctx.log.info('registering new user with email %s', email)
    const { registrationToken } = await ctx.auth.user.beginRegistration({ email })

    await ctx.email.sendUserActivationEmail(email, registrationToken)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
