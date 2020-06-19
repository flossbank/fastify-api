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

    if (!user.billingInfo.customerId) throw new Error('No customer id for user when fetching donation info donation')

    const customerId = user.billingInfo.customerId

    // Fetch donation data from stripe
    let customerInfo = {
      last4: undefined,
      renewal: undefined,
      amount: 0
    }
    try {
      customerInfo = await ctx.stripe.getStripeCustomerDonationInfo(customerId)
    } catch (e) {
      throw new Error('Unable to retrieve customer stripe donation amount even though mongo said they have donation')
    }

    res.send({ success: true, ...customerInfo })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
