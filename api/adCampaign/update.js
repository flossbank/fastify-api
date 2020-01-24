const { AD_NOT_CLEAN } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { adCampaignId, adCampaign, adDrafts, keepDrafts } = req.body
    try {
      await ctx.db.updateAdCampaign(
        req.session.advertiserId,
        adCampaignId,
        adCampaign,
        adDrafts,
        keepDrafts
      )
      res.send({ success: true })
    } catch (e) {
      if (e.code === AD_NOT_CLEAN) {
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
