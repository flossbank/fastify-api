const { ORG_ROLES, MSGS: { INTERNAL_SERVER_ERROR, NO_DONATION, INSUFFICIENT_PERMISSIONS } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { organizationId } = req.query
    ctx.log.info('deleting donation for %s', organizationId)

    /**
     * - Ensure user has perms to delete donation
     * - Ensure a donation exists to delete
     * - Delete the subscription in stripe
     * - Set the donation on the org to 0
     */

    const org = await ctx.db.organization.get({ orgId: organizationId })
    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // If user doesn't have write permissions, return 401
    const userWithWritePerms = org.users.find((user) => {
      return user.userId === req.session.userId && user.role === ORG_ROLES.WRITE
    })
    if (!userWithWritePerms) {
      ctx.log.warn('attempt to delete donation for org user doesnt have write perms to')
      res.status(401)
      return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })
    }

    // If the org doesn't have a donation, return not found
    if (!org.monthlyDonation) {
      res.status(404)
      return res.send({ success: false, message: NO_DONATION })
    }

    if (!org.billingInfo.customerId) throw new Error('No customer id for org wanting to delete donation')

    const customerId = org.billingInfo.customerId

    // Delete the subscription and donation in stripe as well as push the donation change to mongo
    await ctx.stripe.deleteDonation({ customerId })
    await ctx.db.organization.setDonation({
      orgId: organizationId,
      amount: 0
    })

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
