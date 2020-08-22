const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { billingToken, last4 } = req.body
    ctx.log.info(billingToken, last4, 'updating advertiser billing token for id %s', req.session.advertiserId)
    const advertiser = await ctx.db.advertiser.get({ advertiserId: req.session.advertiserId })

    let customerId
    if (!advertiser.billingInfo || !advertiser.billingInfo.customerId) {
      // Create stripe customer, and add the stripe customer id to db
      const stripeCustomer = await ctx.stripe.createStripeCustomer({ email: advertiser.email })
      await ctx.db.advertiser.updateCustomerId({
        advertiserId: req.session.advertiserId,
        customerId: stripeCustomer.id
      })

      customerId = stripeCustomer.id
    } else {
      customerId = advertiser.billingInfo.customerId
    }

    // Update the stripe advertiser with the new billing token (stripe CC card token) if it exists
    await ctx.stripe.updateStripeCustomer({
      customerId,
      sourceId: billingToken
    })
    await ctx.db.advertiser.updateHasCardInfo({
      advertiserId: req.session.advertiserId,
      last4
    })
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
