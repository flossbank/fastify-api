module.exports = async (req, res, ctx) => {
  const { packageId: id, package: updatedPkg } = req.body
  try {
    ctx.log.info(updatedPkg, 'updating package information for package %s', id)
    // Only the owner can make a change to a package
    // Fetch package to check if maintainer making request is the owner
    const pkg = await ctx.db.getPackage(req.body.packageId)

    // TODO BEFORE MASTER if maintainer id from session isn't owner of pkg, bail
    if (!pkg || !pkg.id) {
      ctx.log.warn('attempt to update package information for non-existent package')
      res.status(400)
      return res.send()
    }

    await ctx.db.updatePackage(id, updatedPkg)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
