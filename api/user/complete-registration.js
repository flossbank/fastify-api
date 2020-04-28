module.exports = async (req, res, ctx) => {
  try {
    const { email: rawEmail, pollingToken } = req.body
    const email = rawEmail.toLowerCase()

    ctx.log.info('completing registration for %s', email)

    const apiKey = await ctx.auth.user.completeRegistration({ email, pollingToken })

    if (!apiKey) {
      res.status(404)
      return res.send()
    }

    res.send({ success: true, apiKey })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
