const { MAINTAINER_SESSION_KEY } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const sessionId = req.cookies[MAINTAINER_SESSION_KEY]
  try {
    ctx.log.info('logging out for session id %s', sessionId)
    await ctx.auth.maintainer.deleteWebSession({ sessionId })
    res.clearCookie(
      MAINTAINER_SESSION_KEY,
      { path: '/' }
    )
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
