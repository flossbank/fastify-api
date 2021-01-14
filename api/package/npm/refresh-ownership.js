const { MSGS: { INTERNAL_SERVER_ERROR }, REGISTRIES: { NPM }, LANGUAGES: { JAVASCRIPT } } = require('../../../helpers/constants')

/** This endpoint will do the following:
 * 1) confirm we have necessary information associated with the requesting user to find
 *    the packages they maintain on NPM
 * 2) get the list of packages they maintain on NPM
 * 3) remove the requesting maintainer from any packages they no longer maintain
 * 4) add the requester as a maintainer on any packages in the DB that they maintain
 * 5) create any packages that aren't in our system but were returned from the package registry
 */
module.exports = async (req, res, ctx) => {
  try {
    const { userId } = req.session

    ctx.log.info('refreshing NPM maintainer info for %s', userId)

    const user = await ctx.db.user.get({ userId })

    if (!user || !user[NPM] || !user[NPM].username) {
      ctx.log.warn('attempt to refresh packages for user that has no NPM info stored (%s)', userId)
      res.status(400)
      return res.send({ success: false })
    }

    const packages = await ctx.registry.npm.getOwnedPackages(user[NPM].username)
    ctx.log.info('%s maintains %d packages on NPM', userId, packages.length)

    await ctx.db.package.refreshOwnership({ packages, language: JAVASCRIPT, registry: NPM, userId })

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
