module.exports = async (req, res, ctx) => {
  try {
    const { email } = req.body

    const code = await ctx.auth.sendMagicLink(email)

    res.send({ success: true, code })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
