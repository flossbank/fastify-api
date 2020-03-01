module.exports = async (req, res, ctx) => {
  try {
    const { billingToken, last4 } = req.body
    ctx.log.info(billingToken, last4, 'updating advertiser billing token for id %s', req.session.advertiserId)
    const advertiser = await ctx.db.getAdvertiser(req.session.advertiserId)
    // Update the stripe advertiser with the new billing token (stripe CC card token) if it exists
    await ctx.stripe.updateStripeCustomer(advertiser.billingInfo.customerId, billingToken)
    await ctx.db.updateAdvertiserHasCardInfo(req.session.advertiserId, true, last4)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
