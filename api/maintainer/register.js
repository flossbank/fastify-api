const { alreadyExistsMessage } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  // TODO: validate email and password against regex
  const { maintainer } = req.body
  try {
    let id
    try {
      id = await ctx.db.createMaintainer(maintainer)
    } catch (e) {
      if (e.code === 11000) { // Dupe key mongo error code is 11000
        res.status(400)
        return res.send({
          success: false,
          message: alreadyExistsMessage
        })
      }
      throw e
    }
    await ctx.auth.sendUserToken(maintainer.email, ctx.auth.authKinds.MAINTAINER)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
