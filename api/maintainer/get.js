module.exports = async (req, res, ctx) => {
  if (req.session.maintainerId !== req.query.maintainerId) {
    ctx.log.warn(
      'attempt to get maintainer info for different maintainer id; requested: %s, authorized: %s',
      req.query.maintainerId,
      req.session.maintainerId
    )
    res.status(401)
    return res.send({ success: false })
  }
  try {
    ctx.log.info('getting maintainer info for %s', req.query.maintainerId)
    const maintainer = await ctx.db.getMaintainer(req.query.maintainerId)
    if (!maintainer || !maintainer.verified) {
      ctx.log.warn('attempt to get maintainer info for non-existent or unverified maintainer, rejecting')
      res.status(400)
      return res.send({ success: false })
    }
    res.send({
      success: true,
      maintainer
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
