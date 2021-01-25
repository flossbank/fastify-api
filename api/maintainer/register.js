const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { email: rawEmail, referralCode: rawRefCode } = req.body
    const referralCode = (rawRefCode || '').toLowerCase()
    const email = rawEmail.toLowerCase()

    const existingUser = await ctx.db.user.getByEmail({ email })
    if (existingUser) {
      ctx.log.warn('attempt to register with an email that is already registered %s', email)
      res.status(409)
      return res.send({ success: false })
    }

    ctx.log.info('registering new user (maintainer) with email %s (ref code: %s)', email, referralCode)
    const { registrationToken } = await ctx.auth.user.beginRegistration({ email, referralCode })

    await ctx.email.sendMaintainerActivationEmail(email, registrationToken)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
