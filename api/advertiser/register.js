const { alreadyExistsMessage } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  // TODO: validate email and password against regex
  const { advertiser } = req.body
  try {
    const existing = await ctx.db.advertiserExists(advertiser.email)
    if (existing) {
      res.status(400)
      return res.send({
        success: false,
        message: alreadyExistsMessage
      })
    }
    const id = await ctx.db.createAdvertiser(advertiser)
    await ctx.auth.sendUserToken(advertiser.email, ctx.auth.authKinds.ADVERTISER)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
