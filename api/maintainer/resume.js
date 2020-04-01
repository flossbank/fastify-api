// Resume should effectively "login" the user using just their auth token from their cookie
// and supply the same return values that login does.
module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('resuming maintainer session for %s', req.session.maintainerId)
    const maintainer = await ctx.db.getMaintainer(req.session.maintainerId)
    if (!maintainer || !maintainer.active || !maintainer.verified) {
      ctx.log.warn(
        'attempt to resume session of non-existent, non-verified, or non-active maintainer from %s',
        req.session.maintainerId
      )
      res.status(400)
      return res.send({ success: false })
    }
    res.send({ success: true, maintainer })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
