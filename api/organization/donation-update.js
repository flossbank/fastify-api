const { ORG_ROLES, MSGS: { INTERNAL_SERVER_ERROR, NO_DONATION, INSUFFICIENT_PERMISSIONS } } = require('../../helpers/constants') // eslint-disable-line

module.exports = async (req, res, ctx) => {
  try {
    const { amount, organizationId, globalDonation } = req.body // eslint-disable-line
    ctx.log.info('updating donation for %s to amount %s', organizationId, amount)

    /**
     * - Verify the user has WRITE permissions on the org
     * - Verify a donation exists
     * - Update the donation in stripe
     * - Update the donation in mongo
     */

    const org = await ctx.db.organization.get({ orgId: organizationId })
    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // If user doesn't have write permissions, return 401
    // TODO check GH to see if user's email has admin permissions to the org
    ctx.log.warn('attempt to update donation for org user doesnt have write perms to')
    res.status(401)
    return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })

    // // If the org doesn't have a donation, return not found
    // if (!org.monthlyDonation) {
    //   res.status(404)
    //   return res.send({ success: false, message: NO_DONATION })
    // }

    // const customerId = org.billingInfo.customerId

    // // Update the subscription and donation in stripe as well as push the donation change to mongo
    // await ctx.stripe.updateDonation({ customerId, amount })
    // await ctx.db.organization.setDonation({
    //   orgId: org.id.toString(),
    //   amount,
    //   globalDonation
    // })

    // res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
