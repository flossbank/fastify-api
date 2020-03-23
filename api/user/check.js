module.exports = async (req, res, ctx) => {
  try {
    const { email, apiKey } = req.body
    ctx.log.info('checking that api key is valid for user with email %s', email)

    if (await ctx.auth.hasUserAuthCheckedInPastOneMinute(email)) {
      ctx.log.warn('throttling an attempt to check api key validity for user with email %s', email)
      res.status(429)
      return res.send()
    }

    await ctx.auth.recordUserAuthCheck(email)

    if (!await ctx.auth.checkApiKeyForUser(email, apiKey)) {
      ctx.log.warn('attempt to check invalid api key from user with email %s', email)
      res.status(401)
      return res.send()
    }

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
