const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { code, state } = req.body
    ctx.log.info('github auth requested with code %s and state %s', code, state)

    // TODO: do all logic to fetch email from gh
    await ctx.github.requestAccessToken({ code, state })

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
