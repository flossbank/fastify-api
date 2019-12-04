module.exports = async (req, res, ctx) => {
  try {
    // TODO only allow the advertiser to update their own ad
    const { adId: id, ad } = req.body
    await ctx.db.updateAd(id, ad)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
