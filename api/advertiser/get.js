module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('getting advertiser info for %s', req.session.advertiserId)
    const advertiser = await ctx.db.advertiser.getAdvertiser({ advertiserId: req.session.advertiserId })
    if (!advertiser || !advertiser.verified) {
      ctx.log.warn(
        'attempt to get advertiser info for non-existent or unverified advertiser, rejecting request from %s',
        req.session.advertiserId
      )
      res.status(400)
      return res.send({ success: false })
    }
    res.send({
      success: true,
      advertiser
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
