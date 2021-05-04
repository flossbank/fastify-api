const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('fetching pending payout for %s', req.session.userId)

    const payoutRes = await ctx.db.maintainer.getPendingPayout({
      maintainerId: req.session.userId
    })

    // Round payout to the nearest 10 cents to obfuscate ad revenue abuse mechanism
    const payout = (payoutRes.reduce((total, { payout: p }) => total + p, 0) / 100000).toFixed(1)

    res.send({ success: true, payout })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
