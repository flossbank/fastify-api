const { MSGS: { INTERNAL_SERVER_ERROR, INSUFFICIENT_PERMISSIONS } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    /**
     * - Ensure org exists and user has access to org
     * - Fetch and return impact info
     */

    const { organizationId } = req.query
    ctx.log.info('fetching donation info for %s', organizationId)
    const org = await ctx.db.organization.get({ orgId: organizationId })

    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // If user doesn't have perms for this org - return 401
    const userWithPerms = org.users.find((user) => {
      return user.userId === req.session.userId
    })
    if (!userWithPerms) {
      ctx.log.warn('attempt to get org impact for org user doesnt have perms to')
      res.status(401)
      return res.send({ success: false, message: INSUFFICIENT_PERMISSIONS })
    }

    const orgImpact = { packagesDonatedTo: 100, amount: 200000 }
    res.send({ success: true, orgImpact })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
