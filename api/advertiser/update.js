module.exports = async (req, res, ctx) => {
  try {
    const { advertiserId: id, advertiser } = req.body
    // TODO delete this endpoint? we are at risk of logging a cleartext password here
    // and based on ad/create, adCampaign/create,update we tend toward specific
    // endpoints rather than a general update blob
    ctx.log.info(advertiser, 'updating advertiser', id)
    await ctx.db.updateAdvertiser(id, advertiser)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
