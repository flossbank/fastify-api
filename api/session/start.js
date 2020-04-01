module.exports = async (req, res, ctx) => {
  try {
    const apiKeyInfo = await ctx.auth.getAdSessionApiKey(req)
    if (!apiKeyInfo) {
      ctx.log.warn('attempt to start ad session with invalid api key')
      res.status(401)
      return res.send()
    }

    const ads = apiKeyInfo.optOutOfAds ? [] : await ctx.db.getAdBatch()
    const sessionId = req.body.sessionId || await ctx.auth.createAdSession(req)

    ctx.log.info(
      'sending %d size batch of ads for session id %s; user has opted out: %o',
      ads.length,
      sessionId,
      apiKeyInfo.optOutOfAds
    )
    res.send({ ads, sessionId })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
