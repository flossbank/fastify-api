const { INTEG_TEST_KEY, MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { token } = req.body

    // this is safe because our integ test API key is public knowledge
    if (token === INTEG_TEST_KEY) {
      return res.send({ success: true, apiKey: INTEG_TEST_KEY })
    }

    const apiKey = await ctx.auth.user.getInstallApiKey({ token })
    if (!apiKey) {
      res.status(401)
      return res.send({ success: false })
    }
    res.send({ success: true, apiKey })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
