const { ORG_ROLES, MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    let { name, host } = req.body
    name = name.toLowerCase()
    ctx.log.info('creating or finding org %s host %s', name, host)
    /**
     * - creates a new organization from the one chosen
     * - associates the user with that org and the new org with the user
     * - returns the new org
     */

    let created = false
    const user = await ctx.db.user.get({ userId: req.session.userId })
    let org = await ctx.db.organization.getByNameAndHost({ name, host })
    if (!org) {
      org = await ctx.db.organization.create({ name, host, userId: user.id.toString(), email: user.email })
      created = true
    }
    await ctx.db.user.associateOrgWithUser({
      orgId: org.id.toString(),
      userId: user.id.toString(),
      role: created ? ORG_ROLES.WRITE : ORG_ROLES.READ
    })

    res.send({ success: true, organization: org, created })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
