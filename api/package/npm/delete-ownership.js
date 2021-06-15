const { MSGS: { INTERNAL_SERVER_ERROR }, REGISTRIES: { NPM }, LANGUAGES: { JAVASCRIPT } } = require('../../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('deleting NPM information for: %s', req.session.userId)

    await ctx.db.user.unlinkFromRegistry({ userId: req.session.userId, registry: NPM })

    // effectively tell our DB that this user maintains no packages on NPM
    await ctx.db.package.refreshOwnership({
      packages: [],
      registry: NPM,
      language: JAVASCRIPT,
      userId: req.session.userId
    })

    res.send({ success: true })
  } catch (e) {
    console.log('here', e)
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
