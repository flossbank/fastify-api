module.exports = async (req, res, ctx) => {
  try {
    const { email, token, response } = req.body
    const apiKey = await ctx.auth.validateCaptcha(email, token, response)
    if (!apiKey) {
      res.status(401)
      return res.send()
    }
    res.send({
      success: true,
      apiKey
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
