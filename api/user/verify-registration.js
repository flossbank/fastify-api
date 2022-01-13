const { USER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR, INVALID_EMAIL_TOKEN } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { email: rawEmail, token: registrationToken, recaptchaResponse } = req.body
    const email = rawEmail.toLowerCase()
    ctx.log.info('verifying user with email %s', email)

    const { valid, referralCode } = await ctx.auth.user.validateRegistration({ email, registrationToken, recaptchaResponse })

    if (!valid) {
      ctx.log.warn('attempt to verify user with invalid email or token from %s', email)
      res.status(401)
      return res.send({ success: false, message: INVALID_EMAIL_TOKEN })
    }

    const user = await ctx.db.user.create({ email, referralCode, username: email })
    await ctx.auth.user.cacheApiKey({ apiKey: user.apiKey, userId: user.id.toString() })

    const { sessionId, expiration } = await ctx.auth.user.createWebSession({ userId: user.id.toString() })
    res.setCookie(
      USER_WEB_SESSION_COOKIE,
      sessionId,
      { path: '/', expires: new Date(expiration * 1000) }
    )
    res.send({ success: true, user })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
