const { advertiserSessionKey } = require('../../helpers/constants')

// Resume should effectively "login" the user using just their auth token from their cookie
// and supply the same return values that login does.
module.exports = async (req, res, ctx) => {
  try {
    const advertiser = await ctx.db.getAdvertiser(req.session.advertiserId)
    if (!advertiser) {
      ctx.log.error(new Error('ERROR attempted to resume a session where the advertiser doesnt exist'))
      res.status(400)
      return res.send({ success: false })
    }

    // delete old session and return advertiser with new session token
    await ctx.auth.deleteAdvertiserSession(req.session.sessionId)
    res.setCookie(advertiserSessionKey, await ctx.auth.createAdvertiserSession(req.session.advertiserId))
    res.send({ success: true, advertiser })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
