const { MSGS: { INTERNAL_SERVER_ERROR, NO_DONATION } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('fetching donation info for %s', req.session.userId)
    const user = await ctx.db.user.get({ userId: req.session.userId })
    // If the user doesn't have a donation, return not found
    if (!user.billingInfo.monthlyDonation) {
      res.status(404)
      return res.send({ success: false, message: NO_DONATION })
    }

    if (!user.billingInfo.customerId) throw new Error('No customer id for user wanting to delete donation')

    const customerId = user.billingInfo.customerId

    // Fetch donation data from stripe
    const customer = await ctx.stripe.getStripeCustomer(customerId)
    let amount = 0
    let renewal
    let last4
    try {
      amount = customer.subscriptions.data[0].plan.amount
      // Stripe gives us subscription period end in seconds for some reason
      renewal = customer.subscriptions.data[0].current_period_end * 1000
      last4 = customer.sources.data[0].last4
    } catch (e) {
      throw new Error('Unable to retrieve customer stripe donation amount even though mongo said they have donation')
    }

    res.send({ success: true, amount, last4, renewal })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
