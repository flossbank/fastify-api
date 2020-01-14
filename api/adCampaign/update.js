const { AD_NOT_CLEAN } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { adCampaignId, adCampaign } = req.body

    try {
      await ctx.db.updateAdCampaign(req.session.advertiserId, adCampaignId, adCampaign)
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
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
