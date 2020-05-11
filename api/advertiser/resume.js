// Resume should effectively "login" the user using just their auth token from their cookie
// and supply the same return values that login does.
module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('resuming advertiser session for %s', req.session.advertiserId)
    const advertiser = await ctx.db.getAdvertiser({ advertiserId: req.session.advertiserId })
    if (!advertiser || !advertiser.verified || !advertiser.active) {
      ctx.log.warn(
        'attempt to resume session of non-existent, non-verified, or non-active advertiser from %s',
        req.session.advertiserId
      )
      res.status(400)
      return res.send({ success: false })
    }
    res.send({ success: true, advertiser })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
