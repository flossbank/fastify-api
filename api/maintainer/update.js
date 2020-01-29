module.exports = async (req, res, ctx) => {
  try {
    const { maintainerId: id, maintainer } = req.body
    // TODO delete this endpoint? we are at risk of logging a cleartext password here
    ctx.log.info(maintainer, 'updating maintainer', id)
    await ctx.db.updateMaintainer(id, maintainer)
    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
