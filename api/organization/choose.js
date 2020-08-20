const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { name, host } = req.body
    ctx.log.info('creating or finding org %s', name)
    /**
     * - creates a new organization from the one chosen
     * - associates the user with that org and the new org with the user
     * - returns the new org
     */

    const user = await ctx.db.user.get({ userId: req.session.userId })
    let org = await ctx.db.organization.getByNameAndHost({ name, host })
    if (!org) org = await ctx.db.organization.create({ name, host, userId: user.id })
    await ctx.db.user.associateOrgWithUser({ orgId: org.id.toString() })
    org = await ctx.db.organization.get({ orgId: org.id.toString() })

    res.send({ success: true, organization: org })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
