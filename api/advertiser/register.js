const { alreadyExistsMessage } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { advertiser } = req.body
  try {
    ctx.log.info('registering new advertiser with email %s', advertiser.email)
    try {
      await ctx.db.createAdvertiser(advertiser)
    } catch (e) {
      if (e.code === 11000) { // Dupe key mongo error code is 11000
        ctx.log.warn('attempt to create advertiser with existing email, rejecting request from email %s', advertiser.email)
        res.status(400)
        return res.send({
          success: false,
          message: alreadyExistsMessage
        })
      }
      throw e
    }
    ctx.log.info('sending registration email for newly registered advertiser %s', advertiser.email)
    await ctx.auth.sendToken(advertiser.email, ctx.auth.authKinds.ADVERTISER)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
