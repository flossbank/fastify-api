const { alreadyExistsMessage } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { advertiser: { firstName, lastName, organization, email: rawEmail, password } } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('registering new advertiser with email %s', email)
    try {
      await ctx.db.createAdvertiser({ firstName, lastName, organization, email, password })
    } catch (e) {
      if (e.code === 11000) { // Dupe key mongo error code is 11000
        ctx.log.warn('attempt to create advertiser with existing email, rejecting request from email %s', email)
        res.status(409)
        return res.send({
          success: false,
          message: alreadyExistsMessage
        })
      }
      throw e
    }
    ctx.log.info('sending registration email for newly registered advertiser %s', email)
    const token = await ctx.auth.generateToken(email, ctx.auth.authKinds.ADVERTISER)
    await ctx.email.sendAdvertiserActivationEmail(email, token)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
