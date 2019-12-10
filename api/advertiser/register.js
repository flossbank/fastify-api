module.exports = async (req, res, ctx) => {
  // TODO: validate email and password against regex
  const { advertiser } = req.body
  try {
    const id = await ctx.db.createAdvertiser(advertiser)
    await ctx.auth.sendUserToken(advertiser.email, ctx.auth.authKinds.ADVERTISER)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
