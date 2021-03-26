const { MSGS: { INTERNAL_SERVER_ERROR }, REGISTRIES: { RUBYGEMS }, LANGUAGES: { RUBY } } = require('../../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('deleting RubyGems information for: %s', req.session.userId)

    await ctx.db.user.unlinkFromRegistry({ userId: req.session.userId, registry: RUBYGEMS })

    // effectively tell our DB that this user maintains no packages on RubyGems
    await ctx.db.package.refreshOwnership({
      packages: [],
      registry: RUBYGEMS,
      language: RUBY,
      userId: req.session.userId
    })

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
