module.exports = async (req, res, ctx) => {
  // TODO use req as context for ad retrieval (phase 2)
  if (!await ctx.auth.isAdSessionAllowed(req)) {
    res.status(401)
    return res.send()
  }
  try {
    const ads = await ctx.db.getAdBatch()
    let sessionId = ''
    if (ads.length) {
      sessionId = req.body.sessionId || await ctx.auth.createAdSession(req)
    }
    res.send({ ads, sessionId })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
