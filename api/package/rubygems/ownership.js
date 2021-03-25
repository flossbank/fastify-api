const { MSGS: { INTERNAL_SERVER_ERROR }, REGISTRIES: { RUBYGEMS }, LANGUAGES: { RUBY } } = require('../../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('determining owned packages on RubyGems for maintainer: %s', req.session.userId)

    const { readOnlyToken, username } = req.body

    if (!await ctx.registry.rubygems.tokenUsernameMatch({ readOnlyToken, username })) {
      ctx.log.warn('token does not match username for maintainer %s', req.session.userId)
      res.status(403)
      return res.send({ success: false })
    }

    await ctx.db.user.linkToRegistry({
      userId: req.session.userId,
      registry: RUBYGEMS,
      data: { username }
    })

    ctx.log.info('%s has username %s on RubyGems', req.session.userId, username)

    const packages = await ctx.registry.rubygems.getOwnedPackages({ username })
    await ctx.db.package.refreshOwnership({ packages, registry: RUBYGEMS, language: RUBY, userId: req.session.userId })
    ctx.log.info('%s maintains %d packages on RubyGems', req.session.userId, packages.length)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
