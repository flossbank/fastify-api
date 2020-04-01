module.exports = async (req, res, ctx) => {
  try {
    const { email } = req.body
    ctx.log.info('login requested for user %s', email)

    if (!await ctx.db.getUserByEmail(email)) {
      ctx.log.warn('attempt to login with invalid email %s', email)
      res.status(404)
      return res.send({ success: false })
    }

    const code = await ctx.auth.sendMagicLink(email, ctx.auth.authKinds.USER)

    res.send({ success: true, code })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
