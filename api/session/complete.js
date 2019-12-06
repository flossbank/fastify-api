module.exports = async (req, res, ctx) => {
  try {
    const sessionComplete = await ctx.auth.completeAdSession(req)
    if (!sessionComplete) {
      res.status(401)
      return res.send()
    }
    await ctx.sqs.sendMessage({
      seen: req.body.seen,
      sessionId: req.body.sessionId,
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
