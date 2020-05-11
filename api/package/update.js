module.exports = async (req, res, ctx) => {
  const { packageId, maintainers, owner } = req.body
  try {
    ctx.log.info('updating package information for package %s', packageId)
    // Only the owner can make a change to a package
    // Fetch package to check if maintainer making request is the owner
    const pkg = await ctx.db.package.getPackage({ packageId })

    if (!pkg || !pkg.id) {
      ctx.log.warn('attempt to update package information for non-existent package id %s', packageId)
      res.status(400)
      return res.send()
    }
    if (pkg.owner !== req.session.maintainerId) {
      ctx.log.warn('attempt to update package information from non-owner: %s', req.session.maintainerId)
      res.status(401)
      return res.send()
    }

    await ctx.db.package.updatePackage({ packageId, maintainers, owner })
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
