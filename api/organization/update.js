const { MSGS: { INTERNAL_SERVER_ERROR, INSUFFICIENT_PERMISSIONS } } = require('../../helpers/constants')

/**
 * Currently this route just updates an org email, but should be extended as more update features
 * are necessary. This should NOT replace specific update calls such as donation-update, which should
 * be isolated.
 */
module.exports = async (req, res, ctx) => {
  try {
    const { organizationId, billingEmail, publicallyGive } = req.body
    ctx.log.info('updating org with id %s', organizationId)

    const org = await ctx.db.organization.get({ orgId: organizationId })
    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // confirm user is an admin of the GH org
    const user = await ctx.db.user.get({ userId: req.session.userId })
    const { githubId } = user

    if (!await ctx.github.isUserAnOrgAdmin({ userGitHubId: githubId, organization: org })) {
      ctx.log.warn('attempt to update org that user doesnt have write perms to')
      res.status(401)
      return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })
    }

    if (billingEmail) {
      // add billing email to stripe
      await ctx.stripe.updateCustomerEmail({ customerId: org.billingInfo.customerId, billingEmail })
      await ctx.db.organization.updateEmail({ orgId: org.id.toString(), email: billingEmail, publicallyGive })
    }
    if (publicallyGive) {
      await ctx.db.organization.updatePublicallyGive({ orgId: org.id.toString(), publicallyGive })
    }

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
