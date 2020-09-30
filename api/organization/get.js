const { USER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { organizationId } = req.query
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

    // If we fetched a session,
    // then the request was made with an authenticated user and we should see if the
    // user has access to see private org information
    if (session && session.userId) {
      res.send({ success: true, organization: org })
    } else {
      // Strip off private info from the org
      org = {
        name: org.name,
        globalDonation: org.globalDonation,
        donationAmount: org.donationAmount
      }
      res.send({ success: true, organization: org })
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
