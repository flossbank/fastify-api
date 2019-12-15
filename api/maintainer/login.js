const { maintainerSessionKey } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { email, password } = req.body
    const result = await ctx.db.authenticateMaintainer(email, password)
    if (result.success) {
      res.setCookie(maintainerSessionKey, await ctx.auth.createMaintainerSession(email, result.maintainerId))
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
