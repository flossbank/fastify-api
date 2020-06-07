module.exports = async (req, res, ctx) => {
  const { email: rawEmail, topic, name, body } = req.body
  const email = rawEmail.toLowerCase()
  try {
    ctx.log.info({ ...req.body })
    await ctx.email.sendContactUsEmail({ email, name, topic, body })
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
