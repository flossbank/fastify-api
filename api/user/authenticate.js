const { USER_SESSION_KEY } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { email: rawEmail, token } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info('authenticating with email %s', email)
    if (!await ctx.auth.validateToken(email, token, ctx.auth.authKinds.USER)) {
      ctx.log.warn('attempt to authenticate user with invalid email or token from %s', email)
      res.status(401)
      return res.send()
    }
    await ctx.auth.deleteToken(email)

    const user = await ctx.db.getUserByEmail(email)
    if (!user) {
      throw new Error('illegal state; valid user token but invalid email')
    }

    res.setCookie(
      USER_SESSION_KEY,
      await ctx.auth.createUserSession(user.id.toString()),
      { path: '/' }
    )
    res.send({ success: true, user })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
