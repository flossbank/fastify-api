const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { registry, language } = req.query // optional qualifiers

    ctx.log.info('fetching packages (%s, %s) maintained by %s', registry, language, req.session.userId)

    const packages = await ctx.db.package.getOwnedPackages({
      userId: req.session.userId,
      registry,
      language
    })

    const cleanPackages = packages.map(({
      id, name, language, registry, donationRevenue, adRevenue
    }) => ({
      id,
      name,
      language,
      registry,
      donationRevenue: donationRevenue ? donationRevenue.reduce((acc, r) => acc + r.amount, 0) : 0,
      adRevenue: adRevenue ? adRevenue.reduce((acc, a) => acc + a.amount, 0) : 0
    }))

    res.send({ success: true, packages: cleanPackages })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
