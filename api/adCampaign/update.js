const { AD_NOT_CLEAN } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const campaign = await ctx.db.getAdCampaign(req.body.adCampaignId)

    if (campaign.advertiserId !== req.session.advertiserId || req.body.adCampaign.advertiserId !== req.session.advertiserId) {
      res.status(401)
      return res.send({ success: false })
    }

    const { adCampaignId: id, adCampaign } = req.body

    try {
      await ctx.db.updateAdCampaign(id, adCampaign)
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
