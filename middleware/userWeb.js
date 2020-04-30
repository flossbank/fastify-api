const { USER_WEB_SESSION_COOKIE } = require('../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const session = await ctx.auth.user.getWebSession({
      sessionId: (req.cookies || {})[USER_WEB_SESSION_COOKIE]
    })
    if (!session) {
      ctx.log.warn('attempt to access authenticated user route without valid session')
      res.status(401)
      return res.send()
    }
    req.session = session
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    return res.send()
  }
}
