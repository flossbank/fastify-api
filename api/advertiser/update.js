module.exports = async (req, res, ctx) => {
  try {
    const { advertiserId: id, advertiser } = req.body
    ctx.log.info(advertiser, 'updating advertiser for id %s', id)
    await ctx.db.updateAdvertiser(id, advertiser)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
