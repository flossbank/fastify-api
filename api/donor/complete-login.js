const { DONOR_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { token, codeHost } = req.body
  try {
    ctx.log.info('authenticating with token %s for code host %s', token, codeHost)

    const donor = await ctx.db.donor.createOrGetByAccessToken({ token })

    const { sessionId, expiration } = await ctx.auth.donor.createWebSession({ token })
    res.setCookie(
      DONOR_WEB_SESSION_COOKIE,
      sessionId,
      { path: '/', expires: new Date(expiration * 1000) }
    )
    res.send({ success: true, donor })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
