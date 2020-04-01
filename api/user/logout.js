const { USER_SESSION_KEY } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const sessionId = req.cookies[USER_SESSION_KEY]
  try {
    ctx.log.info('logging out for session id %s', sessionId)
    await ctx.auth.deleteUserSession(sessionId)
    res.clearCookie(
      USER_SESSION_KEY,
      { path: '/' }
    )
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
