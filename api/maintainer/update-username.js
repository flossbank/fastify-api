const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { username } = req.body
    ctx.log.info('updating maintainer username for %s', req.session.userId)
    await ctx.db.user.updateUsername({ userId: req.session.userId, username })
    res.send({
      success: true
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
