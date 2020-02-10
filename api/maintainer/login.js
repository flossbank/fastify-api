const { maintainerSessionKey } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email, password } = req.body
  try {
    ctx.log.info('logging in as maintainer %s', email)
    const maintainer = await ctx.db.authenticateMaintainer(email, password)
    if (maintainer) {
      res.setCookie(
        maintainerSessionKey,
        await ctx.auth.createMaintainerSession(maintainer.id),
        { path: '/' }
      )
      res.send({ success: true, maintainer })
    } else {
      ctx.log.warn('attempt to login with invalid credentials with email %s', email)
      res.status(401)
      res.send({ success: false, message: 'Login failed; Invalid user ID or password' })
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
