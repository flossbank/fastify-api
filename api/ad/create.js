const { AD_NOT_CLEAN } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    try {
      ctx.log.info(req.body, 'creating ad draft for %s', req.session.advertiserId)
      res.send({ success: true, id: await ctx.db.createAdDraft(req.session.advertiserId, req.body) })
    } catch (e) {
      if (e.code === AD_NOT_CLEAN) {
        ctx.log.warn('dirty ad provided, rejecting ad draft from %s', req.session.advertiserId)
        res.status(400)
        return res.send({
          success: false,
          message: e.message
        })
      }
      throw e
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
