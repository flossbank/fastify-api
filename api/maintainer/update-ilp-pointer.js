const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { ilpPointer } = req.body
    ctx.log.info('updating maintainer %s payout ilp', req.session.userId)
    await ctx.db.maintainer.updateIlpPointer({
      userId: req.session.userId,
      ilpPointer
    })
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
