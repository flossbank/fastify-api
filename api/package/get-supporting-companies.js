const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { id: packageId } = req.query
    ctx.log.info('getting companies supporting for package %s', packageId)

    const companiesSupporting = await ctx.db.package.getSupportingCompanies({ packageId })

    res.send({
      success: true,
      companies: companiesSupporting
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
