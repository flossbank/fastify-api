const { MSGS: { INTERNAL_SERVER_ERROR, INSUFFICIENT_PERMISSIONS }, USER_WEB_SESSION_COOKIE } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { organizationId } = req.query
    ctx.log.info('grabbing donation ledger for %s', organizationId)

    const org = await ctx.db.organization.get({ orgId: organizationId })
    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // If org has opted to publically give, then continue and return results.
    // If org has NOT opted to publically give, only return ledger if the user is a GH Admin of the org
    if (!org.publicallyGive) {
      // Attempt to fetch session
      const session = await ctx.auth.user.getWebSession({
        sessionId: req.cookies[USER_WEB_SESSION_COOKIE]
      })
      if (!session || !session.userId) {
        res.status(401)
        return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })
      }

      const user = await ctx.db.user.get({ userId: session.userId })
      const { githubId } = user

      const isGitHubAdmin = await ctx.github.isUserAnOrgAdmin({ userGitHubId: githubId, organization: org })
      if (!isGitHubAdmin) {
        res.status(401)
        return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })
      }
    }

    /**
     * @returns [{ <packageId>, <totalPaid>, <packageName>, <packageRegistry>, <maintainersList> }]
     */
    const ledger = await ctx.db.organization.getDonationLedger({
      orgId: org.id.toString()
    })

    res.send({ success: true, ledger })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
