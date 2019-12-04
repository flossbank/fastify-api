module.exports = async (req, res, ctx) => {
  try {
    // Only the owner can make a change to a package
    // Fetch package to check if maintainer making request is the owner
    const pkg = await ctx.db.getPackage(req.body.packageId)
    // TODO: if maintainer id from session isn't owner of pkg, throw
    if (!pkg.id) {
      res.status(400)
      return res.send()
    }
    const { packageId: id, package: updatedPkg } = req.body
    await ctx.db.updatePackage(id, updatedPkg)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
