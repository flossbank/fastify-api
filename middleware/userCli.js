const { MSGS: { INTERNAL_SERVER_ERROR, INVALID_API_KEY } } = require('../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    // req.headers: { authorization: 'Bearer token' }
    const apiKey = (req.headers.authorization || '').split(' ').pop()
    const apiKeyInfo = await ctx.auth.user.getApiKey({ apiKey })
    if (!apiKeyInfo) {
      ctx.log.warn('attempt to access authenticated CLI route without valid API Key %s', apiKey)
      res.status(401)
      return res.send({ success: false, message: INVALID_API_KEY })
    }
    req.apiKeyInfo = apiKeyInfo
    ctx.log.info({ reqId: req.id }, 'authorized cli user starting session')
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
