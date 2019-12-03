module.exports = async (req, res, ctx) => {
  const sessionId = req.cookies.flossbank_m_sess_id
  try {
    await ctx.auth.deleteMaintainerSession(sessionId)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
