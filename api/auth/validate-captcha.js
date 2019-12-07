module.exports = async (req, res, ctx) => {
  try {
    const { email, token, response } = req.body

    if (!await ctx.auth.validateCaptcha(email, token, response)) {
      res.status(401)
      return res.send()
    }

    res.send({
      success: true,
      apiKey: await ctx.auth.createApiKey(email)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
