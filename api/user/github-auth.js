const { USER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR, NO_GITHUB_EMAIL } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { code, state } = req.body
    ctx.log.info('github auth requested with code %s and state %s', code, state)

    let created = false

    /**
     * - Request an access token from gh using the code and state given to us
     * - request user data from gh using the access token
     * - find or create the user given the email
     * - if created, set created flag to return to UI
     * - create a web session and return the cookie
     */
    const accessToken = await ctx.github.requestAccessToken({ code, state })
    ctx.log.info('Grabbed access token from github')

    const { githubId, login } = await ctx.github.requestUserData({ accessToken })
    ctx.log.info('With GitHub access token received github id %s and login %s', githubId, login)

    const email = await ctx.github.requestUserEmail({ accessToken })
    ctx.log.info('Received email %s from github w/ access token', email)

    if (!email) {
      res.status(400)
      res.send({ success: false, message: NO_GITHUB_EMAIL })
      return
    }

    let user = await ctx.db.user.getByEmail({ email })
    if (!user) {
      created = true
      user = await ctx.db.user.create({ email, githubId, username: login })
      await ctx.auth.user.cacheApiKey({ apiKey: user.apiKey, userId: user.id.toString() })
    } else if (user.githubId !== githubId) {
      // If github user ids are different, update github user id
      await ctx.db.user.updateGithubId({ userId: user.id, githubId })
    }

    const { sessionId, expiration } = await ctx.auth.user.createWebSession({ userId: user.id.toString() })
    res.setCookie(
      USER_WEB_SESSION_COOKIE,
      sessionId,
      { path: '/', expires: new Date(expiration * 1000) }
    )
    res.send({ success: true, user, created })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
