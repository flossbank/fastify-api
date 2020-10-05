const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

// Resume should effectively "login" the user using just their auth token from their cookie
// and supply the same return values that login does.

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('resuming user session for %s', req.session.userId)
    const user = await ctx.db.user.get({ userId: req.session.userId })
    if (!user) {
      ctx.log.warn(
        'attempt to resume session of non-existent user from %s',
        req.session.userId
      )
      res.status(400)
      return res.send({ success: false })
    }
    res.send({ success: true, user })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
