module.exports = async (req, res, ctx) => {
  try {
    const { amount } = req.body
    ctx.log.info('updating donation for %s to amount %s', req.session.userId, amount)
    const user = await ctx.db.user.get({ userId: req.session.userId })
    // If the user doesn't already have a donation, return not found
    if (!user.billingInfo.monthlyDonation) {
      res.status(404)
      return res.send({ success: false, message: 'No donation found' })
    }

    const customerId = user.billingInfo.customerId

    // Update the subscription and donation in stripe as well as push the donation change to mongo
    await ctx.stripe.updateDonation(customerId, amount)
    await ctx.db.user.setDonation({
      userId: req.session.userId,
      amount
    })

    // If the amount of is 10 dollars or above (in cents), opt out of ads in mongo and dynamo
    const noAdThresholdInCents = ctx.config.getNoAdThreshold()
    if (amount >= noAdThresholdInCents) {
      await ctx.db.user.updateOptOutSetting({
        userId: req.session.userId,
        optOutOfAds: true
      })
      await ctx.auth.user.cacheApiKeyNoAdsSetting({ noAds: true, apiKey: user.apiKey })
    } else {
      await ctx.db.user.updateOptOutSetting({
        userId: req.session.userId,
        optOutOfAds: false
      })
      await ctx.auth.user.cacheApiKeyNoAdsSetting({ noAds: false, apiKey: user.apiKey })
    }

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
