module.exports = async (req, res, ctx) => {
  try {
    const { apiKey, noAds } = req.apiKeyInfo

    const ads = noAds ? [] : await ctx.db.getAdBatch()
    const sessionId = req.body.sessionId || await ctx.auth.user.createCliSession({ apiKey })

    ctx.log.info({ adsLength: ads.length, sessionId, noAds })
    res.send({ ads, sessionId })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
