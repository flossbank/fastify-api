const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('getting revenue for maintainer %s', req.session.maintainerId)
    res.send({
      success: true,
      revenue: await ctx.db.maintainer.getRevenue({ maintainerId: req.session.maintainerId })
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
