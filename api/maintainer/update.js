module.exports = async (req, res, ctx) => {
  try {
    const { maintainerId: id, maintainer } = req.body
    await ctx.db.updateMaintainer(id, maintainer)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
