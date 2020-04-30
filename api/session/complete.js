module.exports = async (req, res, ctx) => {
  try {
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
