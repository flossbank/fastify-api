const { MSGS: { INTERNAL_SERVER_ERROR }, REGISTRIES: { NPM } } = require('../../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('determining owned packages on NPM for maintainer: %s', req.session.userId)

    const { readOnlyToken } = req.body

    const username = await ctx.registry.npm.getUsername({ readOnlyToken })
    await ctx.db.user.linkToRegistry({ userId: req.session.userId, registry: NPM, data: { username } })

    ctx.log.info('%s has username %s on NPM', req.session.userId, username)

    const packages = await ctx.registry.npm.getOwnedPackages({ username })
    await ctx.db.package.refreshOwnership({ packages, registry: NPM, maintainerId: req.session.userId })
    ctx.log.info('%s maintains %d packages on NPM', req.session.userId, packages.length)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
