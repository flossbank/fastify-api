const { MAX_ADS_PER_PERIOD } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const session = await ctx.auth.completeAdSession(req)
    if (!session || !session.key) {
      res.status(401)
      return res.send()
    }

    // use case: amy sends session:complete with a doctored `seen`
    // array that contains many more ads than she saw
    const sizedSeen = req.body.seen.slice(
      0,
      MAX_ADS_PER_PERIOD - session.adsSeenThisPeriod
    )
    await ctx.sqs.sendMessage({
      seen: sizedSeen,
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
