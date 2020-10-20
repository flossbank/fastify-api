const { MSGS: { INTERNAL_SERVER_ERROR, NO_DONATION, INSUFFICIENT_PERMISSIONS } } = require('../../helpers/constants') // eslint-disable-line

module.exports = async (req, res, ctx) => {
  try {
    /**
     * - Ensure user has access to org
     * - Ensure org has a donation and a stripe customer id
     * - Fetch donation info from stripe
     */

    const { organizationId } = req.query
    ctx.log.info('fetching donation info for %s', organizationId)
    const org = await ctx.db.organization.get({ orgId: organizationId })

    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // If user doesn't have perms for this org - return 401
    // TODO check GH to see if user's email has admin permissions to the org
    ctx.log.warn('attempt to get donation info for org user doesnt have perms to')
    res.status(401)
    return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })

    // // If the org doesn't have a donation, return not found
    // if (!org.monthlyDonation) {
    //   res.status(404)
    //   return res.send({ success: false, message: NO_DONATION })
    // }

    // if (!org.billingInfo.customerId) throw new Error('No customer id for org when fetching donation info donation')

    // const donationInfo = await ctx.stripe.getStripeCustomerDonationInfo({
    //   customerId: org.billingInfo.customerId
    // })
    // res.send({ success: true, donationInfo })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
