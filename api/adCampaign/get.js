module.exports = async (req, res, ctx) => {
  try {
    res.send({
      success: true,
      adCampaign: await ctx.db.getAdCampaign(req.query.adCampaignId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
