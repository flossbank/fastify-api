const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { email: rawEmail } = req.body
    const email = rawEmail.toLowerCase()
    ctx.log.info('login requested for user %s', email)

    const user = await ctx.db.user.getByEmail({ email })
    if (!user) {
      ctx.log.warn('attempt to login with invalid email %s', email)
      res.status(404)
      return res.send({ success: false })
    }

    const magicLinkParams = await ctx.auth.user.beginAuthentication({ userId: user.id })
    await ctx.email.sendUserMagicLinkEmail(email, magicLinkParams)

    res.send({ success: true, code: magicLinkParams.code })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
