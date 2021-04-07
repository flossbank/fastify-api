const { MSGS: { INTERNAL_SERVER_ERROR, INSUFFICIENT_PERMISSIONS } } = require('../../helpers/constants')

/**
 * Currently this route just updates an org email, but should be extended as more update features
 * are necessary. This should NOT replace specific update calls such as donation-update, which should
 * be isolated.
 */
module.exports = async (req, res, ctx) => {
  try {
    const {
      organizationId,
      billingToken,
      billingEmail,
      publicallyGive,
      description
    } = req.body
    ctx.log.info('%s is updating org with id %s', req.session.userId, organizationId)

    const org = await ctx.db.organization.get({ orgId: organizationId })
    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // confirm user is an admin of the GH org
    const user = await ctx.db.user.get({ userId: req.session.userId })
    const { githubId } = user

    ctx.log.info(
      'checking if user (gh id: %s) has admin perms for org (gh install id: %s)',
      githubId,
      org.installationId
    )

    if (!await ctx.github.isUserAnOrgAdmin({ userGitHubId: githubId, organization: org })) {
      ctx.log.warn('attempt to update org that user doesnt have write perms to (%s)', githubId)
      res.status(401)
      return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })
    }

    if (typeof billingEmail !== 'undefined') {
      // First check to see if there is a customer id for this org already
      let customerId = org.billingInfo.customerId
      if (typeof customerId === 'undefined') {
        // Create stripe customer, and add the stripe customer id to db
        const stripeCustomer = await ctx.stripe.createStripeCustomer({ email: billingEmail })
        customerId = stripeCustomer.id
        await ctx.db.organization.updateCustomerId({
          orgId: org.id.toString(),
          customerId
        })
      }
      // add billing email to stripe
      await ctx.stripe.updateCustomerEmail({ customerId, billingEmail })
      await ctx.db.organization.updateEmail({ orgId: org.id.toString(), email: billingEmail })
    }
    if (typeof publicallyGive !== 'undefined') {
      await ctx.db.organization.updatePublicallyGive({ orgId: org.id.toString(), publicallyGive })
    }
    if (typeof description !== 'undefined') {
      await ctx.db.organization.updateDescription({ orgId: org.id.toString(), description })
    }
    if (typeof billingToken !== 'undefined') {
      // First check to see if there is a customer id for this org already
      let customerId = org.billingInfo.customerId
      if (typeof customerId === 'undefined') {
        // If email doesn't exist yet, return 400
        if (!org.email) {
          res.status(400)
          return res.send({ success: false, message: 'Must have a billing email to add billing info' })
        }
        const stripeCustomer = await ctx.stripe.createStripeCustomer({ email: org.email })
        customerId = stripeCustomer.id
        await ctx.db.organization.updateCustomerId({
          orgId: org.id.toString(),
          customerId
        })
      }
      // Update the stripe customer with the new billing token (stripe CC card token)
      await ctx.stripe.updateStripeCustomer({
        customerId: customerId,
        sourceId: billingToken
      })
    }

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
