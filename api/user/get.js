module.exports = async (req, res, ctx) => {
  try {
    const { userId } = req.session
    res.send({
      success: true,
      user: await ctx.db.getUserById(userId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
