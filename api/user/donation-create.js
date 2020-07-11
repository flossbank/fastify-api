const { MSGS: { INTERNAL_SERVER_ERROR, DONATION_ALREADY_EXISTS } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { amount, billingToken, last4, seeAds } = req.body
    ctx.log.info('creation donation for %s for amount %s, token %s', req.session.userId, amount, billingToken)
    const user = await ctx.db.user.get({ userId: req.session.userId })
    // If the user already has a donation, return conflict
    if (user.billingInfo.monthlyDonation) {
      res.status(409)
      return res.send({ success: false, message: DONATION_ALREADY_EXISTS })
    }

    let customerId
    if (!user.billingInfo || !user.billingInfo.customerId) {
      // Create stripe customer, and add the stripe customer id to db
      const stripeCustomer = await ctx.stripe.createStripeCustomer(user.email)
      await ctx.db.user.updateCustomerId({
        userId: req.session.userId,
        customerId: stripeCustomer.id
      })

      customerId = stripeCustomer.id
    } else {
      customerId = user.billingInfo.customerId
    }

    // Update the stripe user with the billing token (stripe CC card token) and the last 4
    await ctx.stripe.updateStripeCustomer(customerId, billingToken)
    await ctx.db.user.updateHasCardInfo({
      userId: req.session.userId,
      last4
    })

    // Create the subscription and donation in stripe as well as mongo
    await ctx.stripe.createDonation(customerId, amount)
    await ctx.db.user.setDonation({
      userId: req.session.userId,
      amount
    })

    // If the amount (in cents) is above our threshold, opt out of ads in mongo and dynamo
    const noAdThresholdInCents = ctx.config.getNoAdThreshold()
    let optOutOfAds = false
    if (amount >= noAdThresholdInCents && !seeAds) {
      await ctx.db.user.updateOptOutSetting({
        userId: req.session.userId,
        optOutOfAds: true
      })
      await ctx.auth.user.cacheApiKeyNoAdsSetting({ noAds: true, apiKey: user.apiKey })
      optOutOfAds = true
    }

    res.send({ success: true, optOutOfAds })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
