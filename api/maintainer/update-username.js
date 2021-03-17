const { MSGS: { INTERNAL_SERVER_ERROR, ALREADY_EXISTS } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { username } = req.body
    ctx.log.info('updating maintainer username for %s', req.session.userId)
    if (!username) {
      res.status(400)
      return res.send({ success: false })
    }

    try {
      await ctx.db.user.updateUsername({ userId: req.session.userId, username })
    } catch (e) {
      if (e.code === 11000) { // Dupe key mongo error code is 11000
        ctx.log.warn('attempt to udpate username to an existing username for userId: %s', req.session.userId)
        res.status(409)
        return res.send({ success: false, message: ALREADY_EXISTS })
      }
      throw e
    }

    res.send({
      success: true
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
