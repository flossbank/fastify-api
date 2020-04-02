module.exports = async (req, res, ctx) => {
  try {
    if (!await ctx.auth.getAdSessionApiKey(req)) {
      ctx.log.warn('attempt to complete session with invalid api key')
      res.status(401)
      return res.send()
    }

    ctx.log.info(req.body, 'queueing session complete information')
    const { seen, sessionId, packages, registry, language, metadata } = req.body
    await ctx.sqs.sendMessage({
      seen,
      sessionId,
      packages,
      registry,
      language,
      metadata,
      timestamp: Date.now()
    })
    res.status(200)
    res.send()
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
