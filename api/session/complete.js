const { MSGS: { INTERNAL_SERVER_ERROR } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info(req.body, 'queueing session complete information')
    const { seen, sessionId, packages, registry, language, metadata } = req.body
    // await ctx.sqs.sendSessionCompleteMessage({
    //   seen,
    //   sessionId,
    //   packages,
    //   registry,
    //   language,
    //   metadata,
    //   timestamp: Date.now()
    // })
    res.status(200)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
