const { alreadyExistsMessage } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  // TODO: validate email and password against regex
  const { maintainer } = req.body
  try {
    const existing = await ctx.db.maintainerExists(maintainer.email)
    if (existing) {
      res.status(400)
      return res.send({
        success: false,
        message: alreadyExistsMessage
      })
    }
    const id = await ctx.db.createMaintainer(maintainer)
    await ctx.auth.sendUserToken(maintainer.email, ctx.auth.authKinds.MAINTAINER)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
