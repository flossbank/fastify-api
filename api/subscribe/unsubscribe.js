module.exports = async (req, res, ctx) => {
  const { email } = req.body
  try {
    ctx.log.info('unsubscribing to newsletter with email %s', email)
    await ctx.db.unSubscribe(email)
    ctx.log.info('unsubscribed email %s', email)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
