module.exports = async (req, res, ctx) => {
  try {
    const { email: rawEmail, token, response } = req.body
    const email = rawEmail.toLowerCase()

    ctx.log.info('validating captcha for %s', email)

    if (!await ctx.auth.validateCaptcha(email, token, response)) {
      ctx.log.warn('attempt to validate captcha with invalid email, token, or response from %s', email)
      res.status(401)
      return res.send()
    }

    const existingUser = await ctx.db.getUserByEmail(email)
    if (existingUser) {
      await ctx.db.updateUserApiKeysRequested(email)
      return res.send({ success: true, apiKey: existingUser.apiKey })
    }

    const { insertedId, apiKey } = await ctx.db.createUser({ email, billingInfo: {} })
    await ctx.auth.cacheApiKey(apiKey, insertedId.toString())
    res.send({ success: true, apiKey })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
