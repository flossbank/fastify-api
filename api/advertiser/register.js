const { alreadyExistsMessage } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { advertiser } = req.body
  try {
    ctx.log.info('registering new advertiser with email %s', advertiser.email)
    let id
    try {
      // Create stripe customer, and add the customer ID to mongo
      const stripeCustomer = await ctx.stripe.createStripeCustomer(advertiser.email)
      advertiser.billingInfo = {
        customerId: stripeCustomer.id,
        cardOnFile: false
      }
      id = await ctx.db.createAdvertiser(advertiser)
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
    ctx.log.info('sending registration email for newly registered advertiser %s', id)
    await ctx.auth.sendUserToken(advertiser.email, ctx.auth.authKinds.ADVERTISER)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
