module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('deleting donation for %s', req.session.userId)
    const user = await ctx.db.user.getUserById({ userId: req.session.userId })
    // If the user doesn't have a donation, return not found
    if (!user.billingInfo.monthlyDonation) {
      res.status(404)
      return res.send({ success: false, message: 'No donation found' })
    }

    if (!user.billingInfo.customerId) throw new Error('No customer id for user wanting to delete donation')

    const customerId = user.billingInfo.customerId

    // Delete the subscription and donation in stripe as well as push the donation change to mongo
    await ctx.stripe.deleteDonation(customerId)
    await ctx.db.user.setUserDonation({
      userId: req.session.userId,
      amount: 0
    })

    await ctx.db.user.updateUserOptOutSetting({
      userId: req.session.userId,
      optOutOfAds: false
    })
    await ctx.auth.user.cacheApiKeyNoAdsSetting({ noAds: false, apiKey: user.apiKey })

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
