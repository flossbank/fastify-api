const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { payoutInfo } = req.body
    ctx.log.info('updating maintainer for id %s', req.session.maintainerId)
    await ctx.db.maintainer.updatePayoutInfo({
      maintainerId: req.session.maintainerId,
      payoutInfo
    })
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
