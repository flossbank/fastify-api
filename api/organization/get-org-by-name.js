const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { name, host } = req.query
    ctx.log.info('finding org with name %s', name)

    if (!name) {
      res.status(404)
      return res.send({ success: false })
    }

    let org = await ctx.db.organization.getByNameAndHost({ name, host })
    if (!org) {
      res.status(404)
      return res.send({ success: false })
    }

    // Strip off private info from the org
    org = {
      name: org.name,
      id: org.id,
      globalDonation: org.globalDonation,
      donationAmount: org.donationAmount,
      avatarUrl: org.avatarUrl
    }
    res.send({ success: true, organization: org })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
