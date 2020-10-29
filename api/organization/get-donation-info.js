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

    // confirm user is an admin of the GH org
    const user = await ctx.db.user.get({ userId: req.session.userId })
    const { githubId } = user

    if (!await ctx.github.isUserAnOrgAdmin({ userGitHubId: githubId, organization: org })) {
      ctx.log.warn('attempt to create donation for org user doesnt have write perms to')
      res.status(401)
      return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })
    }

    // If the org doesn't have a donation, return not found
    if (!org.monthlyDonation) {
      res.status(404)
      return res.send({ success: false, message: NO_DONATION })
    }

    if (!org.billingInfo.customerId) throw new Error('No customer id for org when fetching donation info donation')

    const donationInfo = await ctx.stripe.getStripeCustomerDonationInfo({
      customerId: org.billingInfo.customerId
    })
    res.send({ success: true, donationInfo })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
