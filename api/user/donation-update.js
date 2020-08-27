const { MSGS: { INTERNAL_SERVER_ERROR, NO_DONATION } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { amount, seeAds } = req.body
    ctx.log.info('updating donation for %s to amount %s', req.session.userId, amount)
    const user = await ctx.db.user.get({ userId: req.session.userId })
    // If the user doesn't already have a donation, return not found
    if (!user.billingInfo.monthlyDonation) {
      res.status(404)
      return res.send({ success: false, message: NO_DONATION })
    }

    const customerId = user.billingInfo.customerId

    // Update the subscription and donation in stripe as well as push the donation change to mongo
    await ctx.stripe.updateDonation({ customerId, amount })
    await ctx.db.user.setDonation({
      userId: req.session.userId,
      amount
    })

    // If the amount (in cents) is above our threshold, opt out of ads in mongo and dynamo
    const noAdThresholdInCents = ctx.config.getNoAdThreshold()
    let optOutOfAds
    if (amount >= noAdThresholdInCents && !seeAds) {
      await ctx.db.user.updateOptOutSetting({
        userId: req.session.userId,
        optOutOfAds: true
      })
      await ctx.auth.user.cacheApiKeyNoAdsSetting({ noAds: true, apiKey: user.apiKey })
      optOutOfAds = true
    } else {
      await ctx.db.user.updateOptOutSetting({
        userId: req.session.userId,
        optOutOfAds: false
      })
      await ctx.auth.user.cacheApiKeyNoAdsSetting({ noAds: false, apiKey: user.apiKey })
      optOutOfAds = false
    }

    res.send({ success: true, optOutOfAds })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
