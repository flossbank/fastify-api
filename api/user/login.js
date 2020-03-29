module.exports = async (req, res, ctx) => {
  try {
    const { email } = req.body

    await ctx.auth.sendUserMagicLink(email)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
