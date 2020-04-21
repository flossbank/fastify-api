module.exports = async (req, res, ctx) => {
  try {
    const { optOutOfAds } = req.body
    const { userId } = req.session
    ctx.log.info('changing opt-out setting for user %s', userId)

    const user = await ctx.db.getUserById(userId)

    await ctx.db.updateUserOptOutSetting(userId, optOutOfAds)
    await ctx.auth.cacheUserOptOutSetting(user.apiKey, optOutOfAds)

    res.send({ success: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
