const { maintainerSessionKey } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { email, password } = req.body
    const maintainer = await ctx.db.authenticateMaintainer(email, password)
    if (maintainer) {
      res.setCookie(
        maintainerSessionKey, 
        await ctx.auth.createMaintainerSession(maintainer.id),
        { path: '/' }
      )
      res.send({ success: true, maintainer })
    } else {
      res.status(401)
      res.send({ success: false, message: 'Login failed; Invalid user ID or password' })
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
