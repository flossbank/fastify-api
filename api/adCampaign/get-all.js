module.exports = async (req, res, ctx) => {
  try {
    const advertiser = await ctx.db.getAdvertiser(req.query.advertiserId)
    if (!advertiser || !advertiser.id) {
      res.status(400)
      return res.send()
    }
    res.send({
      adCampaigns: await ctx.db.getAdCampaignsForAdvertiser(req.query.advertiserId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
