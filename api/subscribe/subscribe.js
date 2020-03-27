const { emailAlreadySubscribed } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email } = req.body
  try {
    ctx.log.info('subscribing to newsletter with email %s', email)
    try {
      await ctx.db.subscribe(email)
    } catch (e) {
      if (e.code === 11000) { // Dupe key mongo error code is 11000
        ctx.log.warn('attempt to subscribe with existing email, rejecting %s', email)
        res.status(400)
        return res.send({
          success: false,
          message: emailAlreadySubscribed
        })
      }
      throw e
    }
    ctx.log.info('subscribing and sending welcome email to: %s', email)
    await ctx.email.sendSubscribeEmail(email)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
