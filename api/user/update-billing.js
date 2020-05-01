module.exports = async (req, res, ctx) => {
  try {
    const { billingToken, last4 } = req.body
    ctx.log.info(billingToken, last4, 'updating user billing token for id %s', req.session.userId)
    const user = await ctx.db.getUserById(req.session.userId)

    let customerId
    if (!user.billingInfo || !user.billingInfo.customerId) {
      // Create stripe customer, and add the stripe customer id to db
      const stripeCustomer = await ctx.stripe.createStripeCustomer(user.email)
      await ctx.db.updateUserCustomerId(req.session.userId, stripeCustomer.id)

      customerId = stripeCustomer.id
    } else {
      customerId = user.billingInfo.customerId
    }

    // Update the stripe advertiser with the new billing token (stripe CC card token) if it exists
    await ctx.stripe.updateStripeCustomer(customerId, billingToken)
    await ctx.db.updateUserHasCardInfo(req.session.userId, true, last4)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
