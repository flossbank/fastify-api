// Resume should effectively "login" the user using just their auth token from their cookie
// and supply the same return values that login does.
module.exports = async (req, res, ctx) => {
  try {
    const advertiser = await ctx.db.getAdvertiser(req.session.advertiserId)
    if (!advertiser || !advertiser.verified || !advertiser.active) {
      ctx.log.error(new Error('ERROR attempted to resume a session where the advertiser doesnt exist'))
      res.status(400)
      return res.send({ success: false })
    }
    res.send({ success: true, advertiser })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
