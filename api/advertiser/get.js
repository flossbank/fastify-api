module.exports = async (req, res, ctx) => {
  if (req.session.advertiserId !== req.query.advertiserId) {
    ctx.log.warn(
      'attempt to get advertiser info for different advertiser id; requested: %s, authorized: %s',
      req.query.advertiserId,
      req.session.advertiserId
    )
    res.status(401)
    return res.send({ success: false })
  }
  try {
    ctx.log.info('getting advertiser info for %s', req.query.advertiserId)
    const advertiser = await ctx.db.getAdvertiser(req.query.advertiserId)
    if (!advertiser || !advertiser.verified) {
      ctx.log.warn('attempt to get advertiser info for non-existent or unverified advertiser, rejecting request from %s', req.session.advertiserId)
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
