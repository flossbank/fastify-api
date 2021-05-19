const { USER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { organizationId } = req.params
    const { noAuth } = req.query
    ctx.log.info('finding org with id %s', organizationId)

    const org = await ctx.db.organization.get({ orgId: organizationId })
    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    const unauthedOrgData = {
      id: org.id,
      name: org.name,
      description: org.description,
      publicallyGive: org.publicallyGive,
      globalDonation: org.globalDonation,
      donationAmount: org.donationAmount,
      totalDonated: org.totalDonated || 0,
      avatarUrl: org.avatarUrl,
      snapshots: org.snapshots
    }

    // if the caller doesn't care about auth'd org data, get out quick
    if (noAuth) {
      return res.send({ success: true, organization: unauthedOrgData })
    }

    // otherwise, attempt to fetch session
    const session = await ctx.auth.user.getWebSession({
      sessionId: req.cookies[USER_WEB_SESSION_COOKIE]
    })

    // If this was fetched without a session, return stripped down org data
    if (!session || !session.userId) {
      // Strip off private info from the org
      return res.send({ success: true, organization: unauthedOrgData })
    }

    // confirm user is an admin of the GH org
    const user = await ctx.db.user.get({ userId: session.userId })
    const { githubId } = user

    if (!await ctx.github.isUserAnOrgAdmin({ userGitHubId: githubId, organization: org })) {
      return res.send({ success: true, organization: unauthedOrgData })
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
