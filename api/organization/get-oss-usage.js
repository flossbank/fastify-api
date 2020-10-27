const { MSGS: { INTERNAL_SERVER_ERROR, NO_SNAPSHOTS } } = require('../../helpers/constants') // eslint-disable-line

module.exports = async (req, res, ctx) => {
  try {
    /**
     * - Gets information from org snapshots array
     * - Returns it
     */

    const { organizationId } = req.query
    ctx.log.info('fetching oss info for %s', organizationId)
    const org = await ctx.db.organization.get({ orgId: organizationId })

    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // If the org doesn't have any snapshots, return not found
    if (!org.snapshots) {
      res.status(404)
      return res.send({ success: false, message: NO_SNAPSHOTS })
    }

    res.send({ success: true, details: org.snapshots.pop() })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
