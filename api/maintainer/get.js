module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('getting maintainer info for %s', req.session.maintainerId)
    const maintainer = await ctx.db.maintainer.get({ maintainerId: req.session.maintainerId })
    if (!maintainer || !maintainer.verified) {
      ctx.log.warn(
        'attempt to get maintainer info for non-existent or unverified maintainer from %s',
        req.session.maintainerId
      )
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
    res.send({ success: false, message: 'Internal server error' })
  }
}
