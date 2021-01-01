const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { name, host } = req.query
    ctx.log.info('finding org with name %s, host %s', name, host)

    const organizations = await ctx.db.organization.searchByNameAndHost({ name, host })

    res.send({ success: true, organizations })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
