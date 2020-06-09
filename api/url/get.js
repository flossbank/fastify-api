const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const location = await ctx.url.getUrl(req.params.id)

    if (!location) {
      ctx.log.warn('attempt to access non-existent url alias %s', req.params.id)
      res.status(404)
      return res.send({ success: false, message: 'URL identifier not found' })
    }

    res.redirect(301, location)
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
