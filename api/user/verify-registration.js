module.exports = async (req, res, ctx) => {
  try {
    const { email: rawEmail, token: registrationToken, recaptchaResponse } = req.body
    const email = rawEmail.toLowerCase()
    ctx.log.info('verifying user with email %s', email)

    if (!await ctx.auth.user.validateRegistration({ email, registrationToken, recaptchaResponse })) {
      ctx.log.warn('attempt to verify user with invalid email or token from %s', email)
      res.status(401)
      return res.send()
    }

    const user = await ctx.db.user.create({ email })
    await ctx.auth.user.cacheApiKey({ apiKey: user.apiKey, userId: user.id.toString() })

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
