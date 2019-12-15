const { advertiserSessionKey } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email, password } = req.body
  try {
    const result = await ctx.db.authenticateAdvertiser(email, password)
    if (result.success) {
      res.setCookie(advertiserSessionKey, await ctx.auth.createAdvertiserSession(email, result.advertiserId))
      res.send({ success: true })
    } else {
      res.status(401)
      res.send(result)
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
