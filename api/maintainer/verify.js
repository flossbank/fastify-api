const { MSGS: { INTERNAL_SERVER_ERROR, INVALID_EMAIL_TOKEN } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email: rawEmail, token } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('verifying maintainer with email %s', email)
    if (!await ctx.auth.maintainer.completeRegistration({ email, token })) {
      ctx.log.warn('attempt to verify maintainer with invalid email or token from email %s', email)
      res.status(401)
      return res.send({ success: false, message: INVALID_EMAIL_TOKEN })
    }
    await ctx.db.maintainer.verify({ email })
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
