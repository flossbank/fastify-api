const { maintainerSessionKey } = require('../../helpers/constants')

// Resume should effectively "login" the user using just their auth token from their cookie
// and supply the same return values that login does.
module.exports = async (req, res, ctx) => {
  try {
    const maintainer = await ctx.db.getMaintainer(req.session.maintainerId)
    if (!maintainer) {
      ctx.log.error(new Error('ERROR attempted to resume a session where the maintainer doesnt exist'))
      res.status(400)
      return res.send({ success: false })
    }

    // delete old session and return maintainer with new session token
    await ctx.auth.deleteMaintainerSession(req.session.sessionId)
    res.setCookie(maintainerSessionKey, await ctx.auth.createMaintainerSession(req.session.maintainerId))
    res.send({ success: true, maintainer })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
