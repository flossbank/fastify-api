const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    console.log('starging get installed packages request here', Date.now())
    const installedPackages = await ctx.db.package.getUserInstalledPackages({ userId: req.session.userId })
    console.log('have installed packages result here', Date.now())

    console.log('sending response here', Date.now())
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
