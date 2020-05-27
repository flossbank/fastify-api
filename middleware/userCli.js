module.exports = async (req, res, ctx) => {
  try {
    // req.headers: { authorization: 'Bearer token' }
    const apiKey = ((req.headers || {}).authorization || '').split(' ').pop()
    const apiKeyInfo = await ctx.auth.user.getApiKey({ apiKey })
    if (!apiKeyInfo) {
      ctx.log.warn('attempt to access authenticated CLI route without valid API Key %s', apiKey)
      res.status(401)
      return res.send()
    }
    req.apiKeyInfo = apiKeyInfo
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    return res.send()
  }
}
