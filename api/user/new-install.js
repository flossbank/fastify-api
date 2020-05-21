module.exports = async (req, res, ctx) => {
  try {
    const { userId } = req.session

    const { email, apiKey } = await ctx.db.user.get({ userId })
    await ctx.db.user.updateApiKeysRequested({ email })

    const token = await ctx.auth.user.setInstallApiKey({ apiKey })

    res.send({ success: true, token })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
