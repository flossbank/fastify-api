const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { id } = req.query
    ctx.log.info('getting package with id %s', id)

    const pkg = await ctx.db.package.get({ packageId: id })

    if (!pkg) {
      res.status(404)
      return res.send({ success: false })
    }

    pkg.adRevenue = pkg.adRevenue
      ? pkg.adRevenue.reduce((acc, session) => acc + session.amount, 0)
      : 0

    pkg.donationRevenue = pkg.donationRevenue
      ? pkg.donationRevenue.reduce((acc, session) => acc + session.amount, 0)
      : 0

    res.send({ success: true, package: pkg })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
