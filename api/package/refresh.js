/** This endpoint will do the following:
 * 1) fetch all packages from the package manager given the stored token
 * 2) remove the requesting maintainer as an owner for any packages they no longer own
 * 3) make the requesting maintainer the new owner for any packages they are new owners for
 * 4) create any packages that aren't in our system but were returned from the package manager
 */
module.exports = async (req, res, ctx) => {
  if (!await ctx.auth.isUIRequestAllowed(req, ctx.auth.authKinds.MAINTAINER)) {
    res.status(401)
    return res.send()
  }
  try {
    const { maintainerId, packageRegistry } = req.body
    const maintainer = await ctx.db.getMaintainer(maintainerId)

    if (!maintainer || !maintainer.id) {
      res.status(400)
      return res.send()
    }

    if (!maintainer.tokens || !maintainer.tokens[packageRegistry] || !ctx.registry[packageRegistry]) {
      res.status(400)
      return res.send()
    }

    const packages = await ctx.registry[packageRegistry].getOwnedPackages(
      maintainer.tokens[packageRegistry]
    )

    await ctx.db.refreshPackageOwnership(packages, packageRegistry, maintainerId)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
