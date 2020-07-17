const { MAINTAINER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR, INVALID_EMAIL_PASSWORD } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email: rawEmail, password } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('logging in as maintainer %s', email)
    const maintainer = await ctx.db.maintainer.authenticate({ email, password })
    if (maintainer) {
      const { sessionId, expiration } = await ctx.auth.maintainer.createWebSession({ maintainerId: maintainer.id.toString() })
      res.setCookie(
        MAINTAINER_WEB_SESSION_COOKIE,
        sessionId,
        { path: '/', expires: new Date(expiration * 1000) }
      )
      res.send({ success: true, maintainer })
    } else {
      ctx.log.warn('attempt to login with invalid credentials with email %s', email)
      res.status(401)
      res.send({ success: false, message: INVALID_EMAIL_PASSWORD })
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
