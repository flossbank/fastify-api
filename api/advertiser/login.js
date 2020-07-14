const { ADVERTISER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR, INVALID_EMAIL_PASSWORD } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email: rawEmail, password } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('logging in as advertiser %s', email)
    const advertiser = await ctx.db.advertiser.authenticate({ email, password })
    if (advertiser) {
      const { sessionId, expiration } = await ctx.auth.advertiser.createWebSession({ advertiserId: advertiser.id.toString() })
      res.setCookie(
        ADVERTISER_WEB_SESSION_COOKIE,
        sessionId,
        { sameSite: 'none', path: '/', secure: true, expires: new Date(expiration * 1000) }
      )
      res.send({ success: true, advertiser })
    } else {
      ctx.log.warn('attempt to login with invalid credentials from email %s', email)
      res.status(401)
      res.send({ success: false, message: INVALID_EMAIL_PASSWORD })
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
