module.exports = async (req, res, ctx) => {
  try {
    const { optOutOfAds } = req.body

    const user = await ctx.db.getUserById(req.session.userId)
    ctx.log.info('changing opt-out setting for user %s', user.email)

    await ctx.auth.updateUserOptOutSetting(user.apiKey, optOutOfAds)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
