const { USER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR, INVALID_EMAIL_TOKEN } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email: rawEmail, token } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('authenticating with email %s', email)

    const user = await ctx.db.user.getByEmail({ email })
    if (!user) {
      ctx.log.warn('attempt to login with invalid email %s', email)
      res.status(404)
      return res.send({ success: false })
    }

    const authResult = await ctx.auth.user.completeAuthentication({ userId: user.id, token })
    if (!authResult.success) {
      ctx.log.warn(authResult, 'authentication failed for user %s', email)
      res.status(401)
      return res.send({ success: false, message: INVALID_EMAIL_TOKEN })
    }

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
