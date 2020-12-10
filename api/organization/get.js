const { USER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { organizationId } = req.params
    ctx.log.info('finding org with id %s', organizationId)

    let org = await ctx.db.organization.get({ orgId: organizationId })
    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // Attempt to fetch session
    const session = await ctx.auth.user.getWebSession({
      sessionId: req.cookies[USER_WEB_SESSION_COOKIE]
    })

    // If this was fetched without a session, return stripped down org data
    if (!session || !session.userId) {
      // Strip off private info from the org
      org = {
        name: org.name,
        globalDonation: org.globalDonation,
        donationAmount: org.donationAmount,
        avatarUrl: org.avatarUrl,
        snapshots: org.snapshots
      }
      return res.send({ success: true, organization: org })
    }

    // Fetch last4 from stripe using customer id
    if (org.billingInfo.customerId) {
      try {
        const last4 = await ctx.stripe.getCustomerLast4({ customerId: org.billingInfo.customerId })
        org.billingInfo.last4 = last4
      } catch (e) {}
    }

    res.send({ success: true, organization: org })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
