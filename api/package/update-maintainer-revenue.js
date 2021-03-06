const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

/**
 * Updating maintainer revenue share should send a list of maintainers and their
 * associated revenue percentage. the revenues should add up to 100, and no maintainer
 * that we have currently on a package should be left off the update list.
 * deleting a maintainer is a separate route.
 */
module.exports = async (req, res, ctx) => {
  const { packageId, maintainers } = req.body
  try {
    ctx.log.info('updating package information for package %s', packageId)
    // Only a maintainer who was sourced from the registry can make a change to a package
    // Fetch package to check if maintainer making request is a maintainer with source registry
    const pkg = await ctx.db.package.get({ packageId })

    if (!pkg || !pkg.id) {
      ctx.log.warn('attempt to update package information for non-existent package id %s', packageId)
      res.status(404)
      return res.send({ success: false })
    }

    // If rev share doesn't add up to 100, return 400
    if (maintainers.reduce((sum, m) => sum + m.revenuePercent, 0) !== 100) {
      ctx.log.warn('attempt to update package maintainers to not 100 total percent')
      res.status(400)
      return res.send({ success: false })
    }

    // Only let a maintainer that was verified through the registry update packages
    const userIsRegistryMaintainer = pkg.maintainers.find((m) => {
      const userMatch = m.userId === req.session.userId
      const registrySource = m.source === 'registry'
      return userMatch && registrySource
    })
    if (!userIsRegistryMaintainer) {
      ctx.log.warn('attempt to update package information from non-owner: %s', req.session.userId)
      res.status(401)
      return res.send({ success: false })
    }

    // Make sure that all existing maintainers of the package are accounted for
    const newMaintainers = maintainers.map(m => m.userId)
    const oldMaintainers = new Set(pkg.maintainers.map(m => m.userId))
    const equalLists =
      oldMaintainers.size === newMaintainers.length &&
      newMaintainers.every(m => oldMaintainers.has(m))

    if (!equalLists) {
      ctx.log.warn('new maintainer list doesnt have same maintainers as existing maintainer list')
      res.status(400)
      return res.send({ success: false })
    }

    // create maintainers to update on db side. This combines the existing fields of the maintainer list
    // such as "source", and just adds the new "revenuePercent" amount
    const newMaintainersList = pkg.maintainers.map((m) => {
      const newMaintainer = maintainers.find(nm => nm.userId === m.userId)
      return {
        ...m,
        revenuePercent: newMaintainer.revenuePercent
      }
    })

    await ctx.db.package.update({ packageId, maintainers: newMaintainersList })
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
