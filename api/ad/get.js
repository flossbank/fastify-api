const VALID_PACKAGE_MANAGERS = new Set(['npm', 'yarn'])

module.exports = async (req, res, ctx) => {
  // TODO use req as context for ad retrieval (phase 2)
  if (!await ctx.auth.isRequestAllowed(req)) {
    res.status(401)
    return res.send()
  }
  if (!req.body || !req.body.packages || !req.body.packageManager) {
    res.status(400)
    return res.send()
  }
  if (!VALID_PACKAGE_MANAGERS.has(req.body.packageManager)) {
    res.status(400)
    return res.send()
  }
  try {
    const ads = await ctx.db.getAdBatch()
    const sessionId = (req.body && req.body.sessionId) || await ctx.auth.createAdSession(req)
    res.send({ ads, sessionId })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
