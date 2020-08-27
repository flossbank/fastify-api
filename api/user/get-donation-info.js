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

    const donationInfo = await ctx.stripe.getStripeCustomerDonationInfo({
      customerId: user.billingInfo.customerId
    })
    res.send({ success: true, donationInfo })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
