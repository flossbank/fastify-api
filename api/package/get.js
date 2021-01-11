const { MSGS: { INTERNAL_SERVER_ERROR }, USER_WEB_SESSION_COOKIE } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { id } = req.query
    ctx.log.info('getting package with id %s', id)

    const pkg = await ctx.db.package.get({ packageId: id })

    if (!pkg) {
      res.status(404)
      return res.send({ success: false })
    }

    // Attempt to fetch session
    const session = await ctx.auth.user.getWebSession({
      sessionId: req.cookies[USER_WEB_SESSION_COOKIE]
    })

    pkg.adRevenue = pkg.adRevenue
      ? pkg.adRevenue.reduce((acc, session) => acc + session.amount, 0)
      : 0

    pkg.donationRevenue = pkg.donationRevenue
      ? pkg.donationRevenue.reduce((acc, session) => acc + session.amount, 0)
      : 0

    const userIsMaintainer = session && pkg.maintainers && pkg.maintainers.find((m) => m.userId === session.userId)

    // Remove maintainer and owner information if unauthorized session
    if (!userIsMaintainer) {
      const unAuthedPackage = {
        id: pkg.id,
        adRevenue: pkg.adRevenue,
        donationRevenue: pkg.donationRevenue,
        name: pkg.name,
        avatarUrl: pkg.avatarUrl,
        language: pkg.language,
        registry: pkg.registry
      }
      return res.send({ success: true, package: unAuthedPackage })
    }

    // Need to map all of the maintainer user id's to usernames
    const mapOfIds = pkg.maintainers.reduce((acc, maintainer) => {
      acc[maintainer.userId] = {
        revenuePercent: maintainer.revenuePercent
      }
      return acc
    }, {})

    const usersFromIds = await ctx.db.user.getListOfUsers({ ids: pkg.maintainers.map((m) => m.userId) })

    usersFromIds.forEach((user) => {
      mapOfIds[user._id.toString()].username = user.username
    })

    pkg.maintainers = Object.values(mapOfIds)

    res.send({ success: true, package: pkg })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
