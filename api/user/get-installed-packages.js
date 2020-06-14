const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const installedPackages = await ctx.db.package.getUserInstalledPackages({ userId: req.session.userId })

    res.send({
      success: true,
      installedPackages
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
