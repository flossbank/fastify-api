const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { name } = req.query
    ctx.log.info('searching packages with name string %s', name)

    const packages = await ctx.db.package.searchByName({ name })

    res.send({ success: true, packages })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
