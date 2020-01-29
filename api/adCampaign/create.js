const { AD_NOT_CLEAN } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    try {
      const { adCampaign, adDrafts, keepDrafts } = req.body
      ctx.log.info(
        { adCampaign, adDrafts, keepDrafts },
        'creating ad campaign for %s',
        req.session.advertiserId
      )
      res.send({
        success: true,
        id: await ctx.db.createAdCampaign(
          req.session.advertiserId,
          adCampaign,
          adDrafts,
          keepDrafts
        )
      })
    } catch (e) {
      if (e.code === AD_NOT_CLEAN) {
        ctx.log.warn('dirty ad provided, rejecting campaign')
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
