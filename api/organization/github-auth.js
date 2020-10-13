const { USER_WEB_SESSION_COOKIE, MSGS: { INTERNAL_SERVER_ERROR }, CODE_HOSTS } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { code, state } = req.body
    ctx.log.info('github auth requested with code %s and state %s', code, state)

    /**
     * - Request an access token from gh using the code and state given to us
     * - request user data from gh using the access token
     * - find or create the user given the email
     * - create a web session and return the cookie
     * - git all github orgs the user is a part of with their access token
     * - do a scan of mongo organizations to see if we have any orgs that they're a part of
     * - return the intersection of the mongo scan and the github orgs list
     */
    const accessToken = await ctx.github.requestAccessToken({ code, state })
    const { email } = await ctx.github.requestUserData({ accessToken })
    let user = await ctx.db.user.getByEmail({ email })
    if (!user) {
      user = await ctx.db.user.create({ email })
      await ctx.auth.user.cacheApiKey({ apiKey: user.apiKey, userId: user.id.toString() })
    }

    const { orgsData } = await ctx.github.getUserOrgs({ accessToken })
    const orgNames = orgsData.reduce((acc, org) => {
      return acc.concat(org.login)
    }, [])

    const existingFlossbankOrgs = await ctx.db.organization.findOrgsByNameAndHost({
      names: orgNames,
      host: CODE_HOSTS.GitHub
    })

    const { sessionId, expiration } = await ctx.auth.user.createWebSession({ userId: user.id.toString() })
    res.setCookie(
      USER_WEB_SESSION_COOKIE,
      sessionId,
      { path: '/', expires: new Date(expiration * 1000) }
    )
    res.send({ success: true, user, organizations: existingFlossbankOrgs })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
