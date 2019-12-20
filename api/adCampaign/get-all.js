module.exports = async (req, res, ctx) => {
  if (req.query.advertiserId !== req.session.advertiserId) {
    res.status(401)
    return res.send({ success: false })
  }
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
