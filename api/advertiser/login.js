const { ADVERTISER_WEB_SESSION_COOKIE } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email: rawEmail, password } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('logging in as advertiser %s', email)
    const advertiser = await ctx.db.authenticateAdvertiser({ email, password })
    if (advertiser) {
      res.setCookie(
        ADVERTISER_WEB_SESSION_COOKIE,
        await ctx.auth.advertiser.createWebSession({ advertiserId: advertiser.id.toString() }),
        { path: '/' }
      )
      res.send({ success: true, advertiser })
    } else {
      ctx.log.warn('attempt to login with invalid credentials from email %s', email)
      res.status(401)
      res.send({ success: false, message: 'Login failed; Invalid user ID or password' })
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
