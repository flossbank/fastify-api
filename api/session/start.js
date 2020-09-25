const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { apiKey, noAds } = req.apiKeyInfo

    const sessionId = req.body.sessionId || await ctx.auth.user.createCliSession({ apiKey })

    let ads = []
    if (!noAds) {
      // get an ethical ad; logs are for timing metrics
      let ethicalAd
      try {
        ctx.log.info({ reqId: req.id }, 'Fetching ethical ad...')
        ethicalAd = await ctx.ethicalAds.getAd({ sessionId })
        ctx.log.info({ reqId: req.id }, 'Ethical ad fetched; fetching Flossbank ads...')
      } catch (e) {
        ctx.log.error('Could not retrieve ethical ad', e)
      }

      ads = await ctx.db.ad.getBatch({ count: ethicalAd ? 11 : 12 })
      ctx.log.info({ reqId: req.id }, 'Flossbank ads fetched')

      if (ethicalAd) ads.push(ethicalAd)
    }

    ctx.log.info({ reqId: req.id, sessionId, noAds })

    res.send({ ads, sessionId })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
