const { advertiserSessionKey } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const sessionId = req.cookies[advertiserSessionKey]
  try {
    ctx.log.info('logging out for session id %s', sessionId)
    await ctx.auth.deleteAdvertiserSession(sessionId)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
