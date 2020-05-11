module.exports = async (req, res, ctx) => {
  try {
    const { amount, billingToken, last4 } = req.body
    ctx.log.info('creation donation for %s for amount %s, token %s', req.session.userId, amount, billingToken)
    const user = await ctx.db.getUserById({ userId: req.session.userId })
    // If the user already has a donation, return conflict
    if (user.billingInfo.monthlyDonation) {
      res.status(409)
      return res.send({ success: false, message: 'Donation already exists' })
    }

    let customerId
    if (!user.billingInfo || !user.billingInfo.customerId) {
      // Create stripe customer, and add the stripe customer id to db
      const stripeCustomer = await ctx.stripe.createStripeCustomer(user.email)
      await ctx.db.updateUserCustomerId({
        userId: req.session.userId,
        customerId: stripeCustomer.id
      })

      customerId = stripeCustomer.id
    } else {
      customerId = user.billingInfo.customerId
    }

    // Update the stripe user with the billing token (stripe CC card token) and the last 4
    await ctx.stripe.updateStripeCustomer(customerId, billingToken)
    await ctx.db.updateUserHasCardInfo({
      userId: req.session.userId,
      last4
    })

    // Create the subscription and donation in stripe as well as mongo
    await ctx.stripe.createDonation(customerId, amount)
    await ctx.db.setUserDonation({
      userId: req.session.userId,
      amount
    })

    // If the amount of is 10 dollars or above (in cents), opt out of ads in mongo and dynamo
    const noAdThresholdInCents = ctx.config.getNoAdThreshold()
    if (amount >= noAdThresholdInCents) {
      await ctx.db.updateUserOptOutSetting({
        userId: req.session.userId,
        optOutOfAds: true
      })
      await ctx.auth.user.cacheApiKeyNoAdsSetting({ noAds: true, apiKey: user.apiKey })
    }

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
