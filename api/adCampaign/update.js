const { AD_NOT_CLEAN } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { adCampaign, adDrafts, keepDrafts } = req.body
    ctx.log.info(
      { adCampaign, adDrafts, keepDrafts },
      'updating ad campaign for %s',
      req.session.advertiserId
    )
    try {
      await ctx.db.updateAdCampaign({
        advertiserId: req.session.advertiserId,
        updatedAdCampaign: adCampaign,
        adIdsFromDrafts: adDrafts,
        keepDrafts
      })
      res.send({ success: true })
    } catch (e) {
      if (e.code === AD_NOT_CLEAN) {
        ctx.log.warn('dirty ad provided, rejecting ad campaign update for %s', req.session.advertiserId)
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
