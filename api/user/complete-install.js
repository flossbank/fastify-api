module.exports = async (req, res, ctx) => {
  try {
    const { token } = req.body
    const apiKey = await ctx.auth.user.getInstallApiKey({ token })
    if (!apiKey) {
      res.status(401)
      return res.send()
    }
    res.send({ success: true, apiKey })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
