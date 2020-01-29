const { advertiserSessionKey } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email, password } = req.body
  try {
    ctx.log.info('logging in as advertiser %s', email)
    const advertiser = await ctx.db.authenticateAdvertiser(email, password)
    if (advertiser) {
      res.setCookie(
        advertiserSessionKey,
        await ctx.auth.createAdvertiserSession(advertiser.id.toString()),
        { path: '/' }
      )
      res.send({ success: true, advertiser })
    } else {
      ctx.log.warn('attempt to login with invalid credentials from email %s', email)
      res.status(401)
      res.send({ success: false, message: 'Login failed; Invalid user ID or password' })
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
