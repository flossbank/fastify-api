const { emailAlreadySubscribed } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email: rawEmail } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('subscribing to beta with email %s', email)
    try {
      const token = await ctx.db.subscribe.betaSubscribe({ email })
      ctx.log.info('subscribing to beta and sending welcome email to: %s with token %s', email, token)
      await ctx.email.sendBetaSubscriptionEmail(email, token)
      res.send({ success: true })
    } catch (e) {
      if (e.code === 11000) { // Dupe key mongo error code is 11000
        ctx.log.warn('attempt to subscribe to beta with existing email, rejecting %s', email)
        res.status(409)
        return res.send({
          success: false,
          message: emailAlreadySubscribed
        })
      }
      throw e
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
