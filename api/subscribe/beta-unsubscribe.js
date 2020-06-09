module.exports = async (req, res, ctx) => {
  const { token } = req.body
  try {
    ctx.log.info('unsubscribing to beta with token %s', token)
    const emailUnsubscribed = await ctx.db.subscribe.betaUnsubscribe({ token })
    ctx.log.info('unsubscribed email from beta %s', emailUnsubscribed)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: 'Internal server error' })
  }
}
