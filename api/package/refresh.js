/** This endpoint will do the following:
 * 1) fetch all packages from the package manager given the stored token
 * 2) remove the requesting maintainer as an owner for any packages they no longer own
 * 3) make the requesting maintainer the new owner for any packages they are new owners for
 * 4) create any packages that aren't in our system but were returned from the package manager
 */
module.exports = async (req, res, ctx) => {
  try {
    const { packageRegistry } = req.body
    ctx.log.info('refreshing packages in %s for maintainer %s', packageRegistry, req.session.maintainerId)

    const maintainer = await ctx.db.getMaintainer(req.session.maintainerId)

    if (!maintainer || !maintainer.id) {
      ctx.log.warn('attempt to refresh packages for non-existent maintainer from id %s', req.session.maintainerId)
      res.status(400)
      return res.send()
    }

    if (!maintainer.tokens || !maintainer.tokens[packageRegistry] || !ctx.registry.isSupported(packageRegistry)) {
      ctx.log.warn('attempt to refresh packages for maintainer %s that has no %s token', req.session.maintainerId, packageRegistry)
      res.status(400)
      return res.send()
    }

    const packages = await ctx.registry[packageRegistry].getOwnedPackages(
      maintainer.tokens[packageRegistry]
    )

    await ctx.db.refreshPackageOwnership(packages, packageRegistry, req.session.maintainerId)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
