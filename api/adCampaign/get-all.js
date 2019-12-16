module.exports = async (req, res, ctx) => {
  try {
    res.send({
      success: true,
      adCampaigns: await ctx.db.getAdCampaignsForAdvertiser(req.query.advertiserId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
